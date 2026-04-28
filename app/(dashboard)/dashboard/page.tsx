import { LayoutDashboard, Bot, BookOpen, MessageSquare } from "lucide-react"
import { redirect } from "next/navigation"
import { getOrProvisionWorkspace } from "@/lib/workspace"

const stats = [
  { label: "Total Chatbots", value: "0", icon: Bot },
  { label: "Knowledge Bases", value: "0", icon: BookOpen },
  { label: "Conversations", value: "0", icon: MessageSquare },
]

export default async function DashboardPage() {
  const ctx = await getOrProvisionWorkspace()
  if (!ctx) redirect("/login")
  if (ctx.role === "MEMBER") redirect("/conversations")

  return (
    <div className="flex flex-col gap-8 p-8">
      <div className="flex items-center gap-3">
        <LayoutDashboard className="size-6 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Overview of your AI chatbot platform
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="flex items-center gap-4 rounded-lg border border-border bg-card p-6 shadow-sm"
          >
            <div className="flex size-10 items-center justify-center rounded-md bg-muted">
              <Icon className="size-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-card-foreground">{value}</p>
              <p className="text-sm text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-card p-8 text-center shadow-sm">
        <Bot className="mx-auto size-12 text-muted-foreground/40" />
        <h2 className="mt-4 text-lg font-medium">No chatbots yet</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Head to Chatbots to create your first AI assistant.
        </p>
      </div>
    </div>
  )
}
