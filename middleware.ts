import { NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"

const COOKIE_NAME = "sk_session"

// Routes the middleware guards — everything under /dashboard
const PROTECTED_PREFIXES = ["/dashboard", "/knowledge-base", "/chatbots", "/settings"]

// Routes that authenticated users should not revisit
const AUTH_ROUTES = ["/login"]

function getSecretKey() {
  const secret = process.env.SESSION_SECRET
  if (!secret) return null
  return new TextEncoder().encode(secret)
}

async function getSessionFromCookie(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) return null

  const key = getSecretKey()
  if (!key) return null

  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] })
    return payload
  } catch {
    return null
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))
  const isAuthRoute = AUTH_ROUTES.some((p) => pathname.startsWith(p))

  if (!isProtected && !isAuthRoute) {
    return NextResponse.next()
  }

  const session = await getSessionFromCookie(req)

  // Unauthenticated user hitting a protected route → send to /login
  if (isProtected && !session) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("redirectTo", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Authenticated user hitting /login → send to dashboard
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return NextResponse.next()
}

export const config = {
  // Run on all routes except Next.js internals and static assets
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
