import Link from "next/link"
import { LogOut } from "lucide-react"
import { getSession } from "@/lib/session"
import { getInitials } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export async function AppHeader() {
  const session = await getSession()

  const initials = getInitials(session?.name, session?.email)
  const displayName = session?.name ?? session?.email ?? "User"
  const displayEmail = session?.name ? session.email : undefined

  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-background px-6">
        {/* Left slot — page breadcrumb can go here later */}
        <div />

        {/* Right: user info + logout */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            {/* Avatar */}
            <div className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {initials}
            </div>
            {/* Name / email */}
            <div className="hidden flex-col sm:flex">
              <span className="text-sm font-medium leading-tight">{displayName}</span>
              {displayEmail && (
                <span className="text-xs leading-tight text-muted-foreground">{displayEmail}</span>
              )}
            </div>
          </div>

          <Separator orientation="vertical" className="h-5" />

          <Button variant="ghost" size="sm" asChild className="gap-1.5 text-muted-foreground hover:text-foreground">
            <Link href="/auth/logout">
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Logout</span>
            </Link>
          </Button>
        </div>
      </header>
      <Separator />
    </>
  )
}
