import { NextRequest } from "next/server"
import OpenAI from "openai"
import { db } from "@/lib/db"
import { generateEmbedding } from "@/lib/embeddings"
import { similaritySearchBySources } from "@/lib/vector-store"
import type { Personality } from "@/lib/chatbot-config"

// Prisma requires Node.js runtime — streaming still works identically.
export const runtime = "nodejs"

const MAX_CONTEXT_CHUNKS = 5
const SIMILARITY_THRESHOLD = 0.45

function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured")
  return new OpenAI({ apiKey })
}

function buildSystemMessage(systemPrompt: string, contextChunks: string[]): string {
  if (contextChunks.length === 0) return systemPrompt

  const context = contextChunks
    .map((c, i) => `[${i + 1}] ${c}`)
    .join("\n\n")

  return `${systemPrompt}

---
KNOWLEDGE BASE CONTEXT:
${context}
---
Use the context above to answer questions when relevant. If the answer is not in the context, rely on your general knowledge but make it clear. Never fabricate specific facts about the product.`
}

export async function POST(req: NextRequest) {
  // ── Parse & validate ────────────────────────────────────────────────────────
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { message, chatbotId } = body as Record<string, unknown>

  if (typeof message !== "string" || !message.trim()) {
    return Response.json({ error: "message is required" }, { status: 400 })
  }
  if (typeof chatbotId !== "string" || !chatbotId.trim()) {
    return Response.json({ error: "chatbotId is required" }, { status: 400 })
  }

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

  const cfg = (chatbot.config ?? {}) as { primaryColor?: string; personality?: Personality }
  const systemPrompt =
    chatbot.systemPrompt ??
    `You are ${chatbot.name}, a helpful support assistant. Be concise and accurate.`

  // ── Retrieve RAG context ────────────────────────────────────────────────────
  const sourceIds = chatbot.knowledgeSources.map((s) => s.knowledgeSourceId)
  let contextChunks: string[] = []

  if (sourceIds.length > 0) {
    try {
      const queryEmbedding = await generateEmbedding(message.trim())
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
          content: buildSystemMessage(systemPrompt, contextChunks),
        },
        { role: "user", content: message.trim() },
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
      try {
        for await (const chunk of openaiStream) {
          const content = chunk.choices[0]?.delta?.content
          if (content) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
            )
          }
          if (chunk.choices[0]?.finish_reason === "stop") {
            controller.enqueue(encoder.encode("data: [DONE]\n\n"))
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
