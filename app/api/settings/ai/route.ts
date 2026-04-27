import { NextRequest, NextResponse } from "next/server"
import { updateAiSettings } from "@/app/actions/settings"

export async function POST(req: NextRequest) {
  const body = await req.json()
  const result = await updateAiSettings(body)
  
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }
  
  return NextResponse.json({ ok: true })
}