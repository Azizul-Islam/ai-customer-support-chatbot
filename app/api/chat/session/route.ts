import { NextRequest } from "next/server"
import { db } from "@/lib/db"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const sessionId = searchParams.get("sessionId")

  if (!sessionId) {
    return Response.json({ error: "sessionId is required" }, { status: 400 })
  }

  const session = await db.chatSession.findUnique({
    where: { id: sessionId },
    select: { id: true, status: true },
  })

  if (!session) {
    return Response.json({ error: "Session not found" }, { status: 404 })
  }

  const messages = await db.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
    select: { id: true, role: true, content: true, createdAt: true },
  })

  return Response.json({ messages, status: session.status })
}

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { chatbotId, visitorId, mode } = body as Record<string, unknown>

  if (typeof chatbotId !== "string" || !chatbotId.trim()) {
    return Response.json({ error: "chatbotId is required" }, { status: 400 })
  }

  const chatbot = await db.chatbot.findUnique({
    where: { id: chatbotId },
    select: { workspaceId: true, status: true },
  })

  if (!chatbot || chatbot.status === "ARCHIVED") {
    return Response.json({ error: "Chatbot not found" }, { status: 404 })
  }

  const session = await db.chatSession.create({
    data: {
      chatbotId,
      workspaceId: chatbot.workspaceId,
      visitorId: typeof visitorId === "string" && visitorId.trim() ? visitorId.trim() : null,
      status: mode === "human" ? "HUMAN_REQUIRED" : "AI_ACTIVE",
    },
  })

  return Response.json({ sessionId: session.id })
}
