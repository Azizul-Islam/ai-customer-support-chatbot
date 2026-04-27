import { redirect } from "next/navigation"
import { MessageSquareMore } from "lucide-react"
import { getSession } from "@/lib/session"
import { scalekit, getRedirectUri } from "@/lib/scalekit"
import { Button } from "@/components/ui/button"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>
}) {
  const session = await getSession()
  if (session) redirect("/dashboard")

  const { redirectTo } = await searchParams

  const authUrl = scalekit.getAuthorizationUrl(getRedirectUri(), {
    // state carries the post-login destination so the callback can redirect there
    state: redirectTo ?? "/dashboard",
    scopes: ["openid", "profile", "email"],
  })

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Brand */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary">
            <MessageSquareMore className="size-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">SupportIQ</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              AI Chatbot Platform
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
          <div className="space-y-2 text-center">
            <h2 className="text-lg font-semibold">Sign in to your workspace</h2>
            <p className="text-sm text-muted-foreground">
              Use your organization account to continue
            </p>
          </div>

          <div className="mt-6">
            <Button asChild className="w-full">
              <a href={authUrl}>Continue with SSO</a>
            </Button>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          By signing in you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  )
}
