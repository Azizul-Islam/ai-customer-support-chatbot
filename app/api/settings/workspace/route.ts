import { NextRequest, NextResponse } from "next/server"
import { updateWorkspaceName } from "@/app/actions/settings"

export async function POST(req: NextRequest) {
  const body = await req.json()
  const result = await updateWorkspaceName(body)
  
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }
  
  return NextResponse.json({ ok: true })
}