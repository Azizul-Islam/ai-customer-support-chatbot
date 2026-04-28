"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  BookOpen,
  Bot,
  Settings,
  MessageSquareMore,
  MessageSquare,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"

const allNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, minRole: "ADMIN" },
  { href: "/knowledge-base", label: "Knowledge Base", icon: BookOpen, minRole: "ADMIN" },
  { href: "/chatbots", label: "Chatbots", icon: Bot, minRole: "ADMIN" },
  { href: "/conversations", label: "Conversations", icon: MessageSquare, minRole: "MEMBER" },
  { href: "/settings", label: "Settings", icon: Settings, minRole: "ADMIN" },
]

const roleRank: Record<string, number> = { OWNER: 3, ADMIN: 2, MEMBER: 1 }

function hasAccess(userRole: string, minRole: string): boolean {
  return (roleRank[userRole] ?? 0) >= (roleRank[minRole] ?? 0)
}

export function AppSidebar({ role = "MEMBER" }: { role?: string }) {
  const pathname = usePathname()

  const navItems = allNavItems.filter((item) => hasAccess(role, item.minRole))

  return (
    <aside className="flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex h-16 shrink-0 items-center gap-2.5 px-6">
        <MessageSquareMore className="size-6 text-sidebar-primary" />
        <span className="text-base font-semibold tracking-tight text-sidebar-foreground">
          SupportIQ
        </span>
      </div>

      <Separator className="bg-sidebar-border" />

      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href || pathname.startsWith(href + "/")
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      <Separator className="bg-sidebar-border" />

      <div className="px-6 py-4">
        <p className="text-xs text-muted-foreground">OneDesk Support Center</p>
        <p className="mt-0.5 text-xs text-muted-foreground/60">v0.1.0</p>
      </div>
    </aside>
  )
}
