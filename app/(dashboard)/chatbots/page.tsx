import Link from "next/link"
import { redirect } from "next/navigation"
import { Bot, Plus, Zap, Settings, Circle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getOrProvisionWorkspace } from "@/lib/workspace"
import { db } from "@/lib/db"
import type { Personality } from "@/lib/chatbot-config"
import { PERSONALITY_META } from "@/lib/chatbot-config"

export default async function ChatbotsPage() {
  const ctx = await getOrProvisionWorkspace()
  if (!ctx) redirect("/login")
  if (ctx.role === "MEMBER") redirect("/conversations")

  const chatbots = ctx
    ? await db.chatbot.findMany({
        where: { workspaceId: ctx.workspace.id },
        orderBy: { updatedAt: "desc" },
      })
    : []

  return (
    <div className="flex flex-col gap-8 p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bot className="size-6 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Chatbots</h1>
            <p className="text-sm text-muted-foreground">
              Build and manage your AI chatbot assistants
            </p>
          </div>
        </div>
        <Button asChild className="gap-2">
          <Link href="/chatbots/customize">
            <Plus className="size-4" />
            New Chatbot
          </Link>
        </Button>
      </div>

      {chatbots.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center">
          <Zap className="mx-auto size-12 text-muted-foreground/40" />
          <h2 className="mt-4 text-lg font-medium">No chatbots created</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Create an AI chatbot, connect a knowledge base, and embed it anywhere.
          </p>
          <Button asChild className="mt-6 gap-2">
            <Link href="/chatbots/customize">
              <Plus className="size-4" />
              Create your first chatbot
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {chatbots.map((bot) => {
            const cfg = (bot.config ?? {}) as { primaryColor?: string; personality?: Personality }
            const color = cfg.primaryColor ?? "#6366f1"
            const personality = cfg.personality ?? "friendly"
            const meta = PERSONALITY_META[personality]

            return (
              <Card key={bot.id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                        style={{ backgroundColor: color }}
                      >
                        {bot.name.charAt(0).toUpperCase()}
                      </div>
                      <CardTitle className="line-clamp-1">{bot.name}</CardTitle>
                    </div>
                    <span className="shrink-0 rounded-full border border-border bg-muted/50 px-2 py-0.5 text-xs font-medium">
                      {meta.badge} {meta.label}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4">
                  {bot.welcomeMessage && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {bot.welcomeMessage}
                    </p>
                  )}
                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Circle
                        className={
                          bot.status === "ACTIVE"
                            ? "size-2 fill-emerald-400 text-emerald-400"
                            : "size-2 fill-muted-foreground/40 text-muted-foreground/40"
                        }
                      />
                      <span className="capitalize">{bot.status.toLowerCase()}</span>
                    </div>
                    <Button variant="outline" size="sm" asChild className="gap-1.5">
                      <Link href={`/chatbots/customize?id=${bot.id}`}>
                        <Settings className="size-3.5" />
                        Edit
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
