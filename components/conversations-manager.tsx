"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Bot,
  User,
  Headphones,
  RefreshCw,
  ChevronLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { getSessionMessages, resolveSession } from "@/app/actions/conversations"
import type { SessionRow, MessageRow } from "@/app/actions/conversations"

// ── Types ──────────────────────────────────────────────────────────────────────

type Filter = "ALL" | "AI_ACTIVE" | "HUMAN_REQUIRED"

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(date: Date): string {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (s < 60) return "just now"
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

function StatusBadge({ status }: { status: SessionRow["status"] }) {
  return status === "HUMAN_REQUIRED" ? (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
      <AlertCircle className="size-3" /> Needs Human
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
      <CheckCircle2 className="size-3" /> AI Active
    </span>
  )
}

function RoleIcon({ role }: { role: MessageRow["role"] }) {
  if (role === "user") return <User className="size-3.5" />
  if (role === "human_agent") return <Headphones className="size-3.5" />
  return <Bot className="size-3.5" />
}

// ── Session list item ─────────────────────────────────────────────────────────

function SessionItem({
  session,
  active,
  onClick,
}: {
  session: SessionRow
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-lg border p-3 text-left transition-colors",
        active
          ? "border-primary/30 bg-primary/5"
          : "border-border bg-card hover:bg-muted/50",
        session.status === "HUMAN_REQUIRED" && !active && "border-amber-200 bg-amber-50/50"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-medium">{session.chatbotName}</span>
            {session.status === "HUMAN_REQUIRED" && (
              <span className="size-2 shrink-0 rounded-full bg-amber-400" />
            )}
          </div>
          {session.lastMessage && (
            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
              {session.lastMessage}
            </p>
          )}
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <span>{session.messageCount} msg{session.messageCount !== 1 ? "s" : ""}</span>
            <span>·</span>
            <span>{timeAgo(session.updatedAt)}</span>
          </div>
        </div>
        <StatusBadge status={session.status} />
      </div>
    </button>
  )
}

// ── Thread view ───────────────────────────────────────────────────────────────

function ThreadView({
  session,
  messages,
  onResolve,
  onBack,
}: {
  session: SessionRow
  messages: MessageRow[]
  onResolve: () => void
  onBack: () => void
}) {
  const [resolving, startResolve] = useTransition()

  const handleResolve = () => {
    startResolve(async () => {
      await resolveSession(session.id)
      onResolve()
    })
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
          >
            <ChevronLeft className="size-4" />
          </button>
          <div>
            <p className="text-sm font-semibold">{session.chatbotName}</p>
            <p className="text-xs text-muted-foreground">
              {session.visitorId ? `Visitor: ${session.visitorId}` : "Anonymous visitor"} ·{" "}
              {new Date(session.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={session.status} />
          {session.status === "HUMAN_REQUIRED" && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs"
              onClick={handleResolve}
              disabled={resolving}
            >
              {resolving ? (
                <RefreshCw className="size-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="size-3.5" />
              )}
              Mark Resolved
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto bg-gray-50 px-4 py-4">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">No messages yet.</p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-2.5",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {msg.role !== "user" && (
                <div
                  className={cn(
                    "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-white",
                    msg.role === "human_agent" ? "bg-purple-500" : "bg-primary"
                  )}
                >
                  <RoleIcon role={msg.role} />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[72%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                  msg.role === "user"
                    ? "rounded-br-sm bg-gray-700 text-white"
                    : msg.role === "human_agent"
                      ? "rounded-bl-sm bg-purple-100 text-purple-900"
                      : "rounded-bl-sm bg-primary text-primary-foreground"
                )}
              >
                {msg.content}
                <p className="mt-1 text-[10px] opacity-60">
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              {msg.role === "user" && (
                <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-gray-500 text-white">
                  <RoleIcon role={msg.role} />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function ConversationsManager({
  initialSessions,
}: {
  initialSessions: SessionRow[]
}) {
  const router = useRouter()
  const [filter, setFilter] = useState<Filter>("ALL")
  const [sessions] = useState<SessionRow[]>(initialSessions)
  const [selectedSession, setSelectedSession] = useState<SessionRow | null>(null)
  const [messages, setMessages] = useState<MessageRow[]>([])
  const [loadingThread, startLoadThread] = useTransition()

  const filtered = sessions.filter(
    (s) => filter === "ALL" || s.status === filter
  )

  const needsHuman = sessions.filter((s) => s.status === "HUMAN_REQUIRED").length

  const selectSession = (session: SessionRow) => {
    setSelectedSession(session)
    startLoadThread(async () => {
      const msgs = await getSessionMessages(session.id)
      setMessages(msgs)
    })
  }

  const handleResolve = () => {
    router.refresh()
    if (selectedSession) {
      setSelectedSession((s) => s ? { ...s, status: "AI_ACTIVE" } : null)
    }
  }

  const filterBtn = (f: Filter, label: string, count?: number) => (
    <button
      type="button"
      onClick={() => setFilter(f)}
      className={cn(
        "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
        filter === f
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span
          className={cn(
            "rounded-full px-1.5 py-0.5 text-xs font-semibold",
            filter === f ? "bg-white/20" : "bg-amber-100 text-amber-700"
          )}
        >
          {count}
        </span>
      )}
    </button>
  )

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Left: Session list ───────────────────────────────────────────── */}
      <div
        className={cn(
          "flex w-full flex-col border-r border-border lg:w-96 lg:shrink-0",
          selectedSession ? "hidden lg:flex" : "flex"
        )}
      >
        {/* Header */}
        <div className="shrink-0 border-b border-border px-4 py-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="size-5 text-muted-foreground" />
            <h1 className="text-lg font-semibold">Conversations</h1>
          </div>
          <div className="mt-3 flex gap-1">
            {filterBtn("ALL", "All", undefined)}
            {filterBtn("HUMAN_REQUIRED", "Needs Human", needsHuman)}
            {filterBtn("AI_ACTIVE", "AI Active")}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <MessageSquare className="size-10 text-muted-foreground/30" />
              <p className="mt-3 text-sm text-muted-foreground">No conversations yet.</p>
              <p className="text-xs text-muted-foreground/60">
                Sessions appear once visitors chat with your bots.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filtered.map((s) => (
                <SessionItem
                  key={s.id}
                  session={s}
                  active={selectedSession?.id === s.id}
                  onClick={() => selectSession(s)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Right: Thread ────────────────────────────────────────────────── */}
      <div
        className={cn(
          "flex-1",
          selectedSession ? "flex flex-col" : "hidden lg:flex lg:items-center lg:justify-center"
        )}
      >
        {selectedSession ? (
          loadingThread ? (
            <div className="flex flex-1 items-center justify-center">
              <RefreshCw className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ThreadView
              session={selectedSession}
              messages={messages}
              onResolve={handleResolve}
              onBack={() => setSelectedSession(null)}
            />
          )
        ) : (
          <div className="text-center">
            <MessageSquare className="mx-auto size-12 text-muted-foreground/20" />
            <p className="mt-3 text-sm text-muted-foreground">
              Select a conversation to view messages.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
