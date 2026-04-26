import { NextRequest } from "next/server"
import { db } from "@/lib/db"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { chatbotId, visitorId } = body as Record<string, unknown>

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
    },
  })

  return Response.json({ sessionId: session.id })
}
