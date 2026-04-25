import { NextRequest, NextResponse } from "next/server"
import { scalekit } from "@/lib/scalekit"
import { getSession, deleteSession } from "@/lib/session"

export async function GET(req: NextRequest) {
  const session = await getSession()

  await deleteSession()

  // Build ScaleKit logout URL so the IdP session is also terminated.
  // Falls back to /login if the SDK call fails for any reason.
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    const logoutUrl = scalekit.getLogoutUrl({
      ...(session?.idToken ? { idTokenHint: session.idToken } : {}),
      postLogoutRedirectUri: `${appUrl}/login`,
    })
    return NextResponse.redirect(logoutUrl)
  } catch {
    return NextResponse.redirect(new URL("/login", req.url))
  }
}
