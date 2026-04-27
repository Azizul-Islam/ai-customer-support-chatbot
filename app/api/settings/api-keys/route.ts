import { NextRequest, NextResponse } from "next/server"
import { createApiKey, deleteApiKey, getApiKeys } from "@/app/actions/settings"

export async function GET() {
  const keys = await getApiKeys()
  return NextResponse.json(keys)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const result = await createApiKey({ name: body.name })
  
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }
  
  return NextResponse.json(result)
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 })
  }
  
  const result = await deleteApiKey(id)
  
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }
  
  return NextResponse.json({ ok: true })
}