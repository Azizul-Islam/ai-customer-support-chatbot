import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getOrProvisionWorkspace } from "@/lib/workspace"

export async function GET() {
  const ctx = await getOrProvisionWorkspace()
  if (!ctx) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const workspace = await db.workspace.findUnique({
    where: { id: ctx.workspace.id },
    include: { settings: true },
  })

  return NextResponse.json({
    workspaceId: ctx.workspace.id,
    workspaceName: ctx.workspace.name,
    settings: workspace?.settings,
    envKeyExists: !!process.env.OPENAI_API_KEY,
    envKeyValue: process.env.OPENAI_API_KEY ? "set (length " + process.env.OPENAI_API_KEY.length + ")" : "not set",
  })
}