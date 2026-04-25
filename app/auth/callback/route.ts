import { NextRequest, NextResponse } from "next/server"
import { scalekit, getRedirectUri } from "@/lib/scalekit"
import { createSession } from "@/lib/session"

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")
  const idpInitiatedLogin = searchParams.get("idp_initiated_login")

  // --- error from ScaleKit ---
  if (error) {
    const desc = searchParams.get("error_description") ?? "Authentication failed"
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(desc)}`, req.url)
    )
  }

  // --- IdP-initiated SSO: convert to SP-initiated flow ---
  if (idpInitiatedLogin) {
    try {
      const claims = await scalekit.getIdpInitiatedLoginClaims(idpInitiatedLogin)
      const authUrl = scalekit.getAuthorizationUrl(getRedirectUri(), {
        connectionId: claims.connection_id,
        organizationId: claims.organization_id,
        loginHint: claims.login_hint,
        ...(claims.relay_state ? { state: claims.relay_state } : {}),
      })
      return NextResponse.redirect(authUrl)
    } catch {
      return NextResponse.redirect(new URL("/login?error=idp_login_failed", req.url))
    }
  }

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", req.url))
  }

  // --- Exchange authorization code for tokens ---
  try {
    const authResp = await scalekit.authenticateWithCode(code, getRedirectUri())
    const { user, accessToken, refreshToken, idToken, expiresIn } = authResp

    await createSession({
      userId: user.id ?? user.email,
      email: user.email,
      name: user.name ?? null,
      accessToken,
      refreshToken: refreshToken ?? "",
      idToken: idToken ?? "",
      expiresAt: Date.now() + (expiresIn ?? 3600) * 1000,
    })

    // Redirect to the original destination carried in `state`, or default to /dashboard.
    // Validate it's a relative path to prevent open-redirect.
    const destination =
      state && state.startsWith("/") ? state : "/dashboard"

    return NextResponse.redirect(new URL(destination, req.url))
  } catch {
    return NextResponse.redirect(
      new URL("/login?error=authentication_failed", req.url)
    )
  }
}
