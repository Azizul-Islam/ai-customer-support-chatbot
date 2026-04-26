import { NextRequest } from "next/server"
import OpenAI from "openai"
import { db } from "@/lib/db"
import { generateEmbedding } from "@/lib/embeddings"
import { similaritySearchBySources } from "@/lib/vector-store"
import type { Personality } from "@/lib/chatbot-config"

export const runtime = "nodejs"

const MAX_CONTEXT_CHUNKS = 5
const SIMILARITY_THRESHOLD = 0.45
const ESCALATE_MARKER = "[ESCALATE]"

// function getOpenAI(): OpenAI {
//   const apiKey = process.env.OPENAI_API_KEY
//   if (!apiKey) throw new Error("OPENAI_API_KEY not configured")
//   return new OpenAI({ apiKey })
// }

function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY
  // OpenRouter doesn't strictly require an API key for free models, 
  // but it's best practice to use one to avoid being treated as a bot.
  
  return new OpenAI({
    apiKey: apiKey, 
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": "http://localhost:3000", 
      "X-Title": "OneDesk AI Build",         
    }
  })
}

function buildSystemMessage(
  systemPrompt: string,
  contextChunks: string[],
  hasKnowledgeBase: boolean
): string {
  let prompt = systemPrompt

  if (contextChunks.length > 0) {
    const context = contextChunks.map((c, i) => `[${i + 1}] ${c}`).join("\n\n")
    prompt += `\n\n---\nKNOWLEDGE BASE CONTEXT:\n${context}\n---\nUse the context above to answer questions when relevant. Never fabricate specific facts about the product.`
  }

  if (hasKnowledgeBase) {
    prompt += `\n\nIMPORTANT: If you cannot confidently answer the question from the provided context or your knowledge, append the exact text "${ESCALATE_MARKER}" at the very end of your response with no text after it. Omit it entirely if you can answer confidently.`
  }

  return prompt
}

export async function POST(req: NextRequest) {
  // ── Parse & validate ────────────────────────────────────────────────────────
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { message, chatbotId, sessionId } = body as Record<string, unknown>

  if (typeof message !== "string" || !message.trim()) {
    return Response.json({ error: "message is required" }, { status: 400 })
  }
  if (typeof chatbotId !== "string" || !chatbotId.trim()) {
    return Response.json({ error: "chatbotId is required" }, { status: 400 })
  }

  const trimmedMessage = message.trim()

  // ── Fetch chatbot config ────────────────────────────────────────────────────
  const chatbot = await db.chatbot.findUnique({
    where: { id: chatbotId },
    include: {
      knowledgeSources: {
        select: { knowledgeSourceId: true },
        where: { knowledgeSource: { status: "READY" } },
      },
    },
  })

  if (!chatbot) {
    return Response.json({ error: "Chatbot not found" }, { status: 404 })
  }

  const systemPrompt =
    chatbot.systemPrompt ??
    `You are ${chatbot.name}, a helpful support assistant. Be concise and accurate.`

  // ── Resolve session (optional) ──────────────────────────────────────────────
  // Session must belong to this chatbot — prevents cross-chatbot message injection.
  let session: { id: string } | null = null
  if (typeof sessionId === "string" && sessionId.trim()) {
    session = await db.chatSession.findFirst({
      where: { id: sessionId.trim(), chatbotId },
      select: { id: true },
    })
  }

  // Save user message before streaming so it's persisted even on stream failure
  if (session) {
    await db.chatMessage.create({
      data: { sessionId: session.id, role: "user", content: trimmedMessage },
    })
  }

  // ── Retrieve RAG context ────────────────────────────────────────────────────
  const sourceIds = chatbot.knowledgeSources.map((s) => s.knowledgeSourceId)
  let contextChunks: string[] = []

  if (sourceIds.length > 0) {
    try {
      const queryEmbedding = await generateEmbedding(trimmedMessage)
      const chunks = await similaritySearchBySources(
        queryEmbedding,
        sourceIds,
        MAX_CONTEXT_CHUNKS,
        SIMILARITY_THRESHOLD
      )
      contextChunks = chunks.map((c) => c.content)
    } catch {
      // Non-fatal — continue without context
    }
  }

  const hasKnowledgeBase = sourceIds.length > 0

  // ── Stream GPT-4o ───────────────────────────────────────────────────────────
  const openai = getOpenAI()

  let openaiStream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>
  try {
    openaiStream = await openai.chat.completions.create({
      model: "gpt-4o",
      stream: true,
      temperature: 0.7,
      max_tokens: 1024,
      messages: [
        {
          role: "system",
          content: buildSystemMessage(systemPrompt, contextChunks, hasKnowledgeBase),
        },
        { role: "user", content: trimmedMessage },
      ],
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "OpenAI error"
    return Response.json({ error: msg }, { status: 502 })
  }

  // ── SSE stream ──────────────────────────────────────────────────────────────
  const encoder = new TextEncoder()

  const readable = new ReadableStream({
    async start(controller) {
      let fullResponse = ""

      try {
        for await (const chunk of openaiStream) {
          const token = chunk.choices[0]?.delta?.content
          if (token) {
            fullResponse += token
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ content: token })}\n\n`)
            )
          }
        }

        // Detect escalation marker in the complete response
        const markerIdx = fullResponse.lastIndexOf(ESCALATE_MARKER)
        const humanRequired = markerIdx !== -1
        const cleanResponse = humanRequired
          ? fullResponse.slice(0, markerIdx).trimEnd()
          : fullResponse

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ done: true, humanRequired })}\n\n`
          )
        )
        controller.enqueue(encoder.encode("data: [DONE]\n\n"))

        // ── Post-stream DB writes ─────────────────────────────────────────────
        if (session && cleanResponse) {
          await db.chatMessage.create({
            data: {
              sessionId: session.id,
              role: "assistant",
              content: cleanResponse,
            },
          })

          if (humanRequired) {
            await db.chatSession.update({
              where: { id: session.id },
              data: { status: "HUMAN_REQUIRED" },
            })
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Stream error"
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`)
        )
      } finally {
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  })
}
