"use client"

import { useEffect, useRef, useState } from "react"
import { Send, Loader2, Minimize2 } from "lucide-react"
import { cn } from "@/lib/utils"

// ── Types ──────────────────────────────────────────────────────────────────────

interface Message {
  id: string
  role: "bot" | "user"
  text: string
  streaming?: boolean
  ts: Date
}

export interface ChatConfig {
  chatbotId: string
  botName: string
  welcomeMessage: string
  primaryColor: string
}

// ── Color helpers ──────────────────────────────────────────────────────────────

function contrastColor(hex: string): string {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return "#ffffff"
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55 ? "#1a1a2e" : "#ffffff"
}

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r} ${g} ${b}`
}

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

// ── SSE streaming ──────────────────────────────────────────────────────────────

async function streamChat(
  chatbotId: string,
  message: string,
  onToken: (t: string) => void,
  onDone: () => void,
  onError: (e: string) => void
) {
  let res: Response
  try {
    res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatbotId, message }),
    })
  } catch {
    onError("Network error — please try again.")
    return
  }
  if (!res.ok || !res.body) { onError(`Server error (${res.status})`); return }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buf = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    const lines = buf.split("\n")
    buf = lines.pop() ?? ""
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue
      const raw = line.slice(6).trim()
      if (raw === "[DONE]") { onDone(); return }
      try {
        const p = JSON.parse(raw) as { content?: string; error?: string }
        if (p.content) onToken(p.content)
        if (p.error) { onError(p.error); return }
      } catch { /* ignore */ }
    }
  }
  onDone()
}

// ── Typing dots ────────────────────────────────────────────────────────────────

function TypingDots({ color }: { color: string }) {
  return (
    <div className="flex items-center gap-1 px-1 py-0.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="block size-2 rounded-full animate-bounce"
          style={{
            backgroundColor: color,
            animationDelay: `${i * 160}ms`,
            animationDuration: "900ms",
          }}
        />
      ))}
    </div>
  )
}

// ── Message bubble ─────────────────────────────────────────────────────────────

function BotBubble({
  msg,
  initial,
  primaryColor,
  textColor,
  showTyping,
}: {
  msg: Message
  initial: string
  primaryColor: string
  textColor: string
  showTyping: boolean
}) {
  return (
    <div className="flex items-end gap-2.5 pr-10">
      <div
        className="flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-sm"
        style={{ backgroundColor: primaryColor, color: textColor }}
      >
        {initial}
      </div>
      <div className="flex flex-col gap-1">
        <div
          className="rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm leading-relaxed shadow-sm"
          style={{ backgroundColor: primaryColor, color: textColor }}
        >
          {showTyping && !msg.text ? (
            <TypingDots color={textColor} />
          ) : (
            <>
              {msg.text}
              {msg.streaming && msg.text && (
                <span
                  className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse rounded-full align-middle"
                  style={{ backgroundColor: textColor, opacity: 0.6 }}
                />
              )}
            </>
          )}
        </div>
        <span className="pl-1 text-[10px] text-gray-400">{formatTime(msg.ts)}</span>
      </div>
    </div>
  )
}

function UserBubble({ msg }: { msg: Message }) {
  return (
    <div className="flex items-end justify-end gap-2.5 pl-10">
      <div className="flex flex-col items-end gap-1">
        <div className="rounded-2xl rounded-br-sm bg-gray-700 px-4 py-2.5 text-sm leading-relaxed text-white shadow-sm">
          {msg.text}
        </div>
        <span className="pr-1 text-[10px] text-gray-400">{formatTime(msg.ts)}</span>
      </div>
    </div>
  )
}

// ── Main chat interface ────────────────────────────────────────────────────────

let _id = 0
const uid = () => String(++_id)

export function ChatWindow({ config, onClose }: { config: ChatConfig; onClose?: () => void }) {
  const { chatbotId, botName, welcomeMessage, primaryColor } = config
  const textColor = contrastColor(primaryColor)
  const rgb = hexToRgb(primaryColor)
  const initial = (botName || "B").charAt(0).toUpperCase()

  const [messages, setMessages] = useState<Message[]>([
    { id: uid(), role: "bot", text: welcomeMessage || "Hi! How can I help you?", ts: new Date() },
  ])
  const [input, setInput] = useState("")
  const [busy, setBusy] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (window.parent !== window) {
      window.parent.postMessage({ type: "cb:color", color: primaryColor }, "*")
    }
  }, [primaryColor])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const send = () => {
    const text = input.trim()
    if (!text || busy) return
    setInput("")
    setBusy(true)

    const userMsg: Message = { id: uid(), role: "user", text, ts: new Date() }
    const botId = uid()
    const botMsg: Message = { id: botId, role: "bot", text: "", streaming: true, ts: new Date() }
    setMessages((p) => [...p, userMsg, botMsg])

    streamChat(
      chatbotId, text,
      (token) => setMessages((p) => p.map((m) => m.id === botId ? { ...m, text: m.text + token } : m)),
      () => { setMessages((p) => p.map((m) => m.id === botId ? { ...m, streaming: false } : m)); setBusy(false); inputRef.current?.focus() },
      (err) => { setMessages((p) => p.map((m) => m.id === botId ? { ...m, text: err, streaming: false } : m)); setBusy(false); inputRef.current?.focus() }
    )
  }

  return (
    <div
      className="flex h-full flex-col overflow-hidden rounded-2xl"
      style={{ "--primary-rgb": rgb } as React.CSSProperties}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div
        className="relative shrink-0 overflow-hidden px-4 py-3.5"
        style={{ backgroundColor: primaryColor }}
      >
        {/* Decorative circles */}
        <div
          className="absolute -right-6 -top-6 size-24 rounded-full opacity-10"
          style={{ backgroundColor: textColor }}
        />
        <div
          className="absolute -bottom-8 -right-2 size-20 rounded-full opacity-[0.07]"
          style={{ backgroundColor: textColor }}
        />

        <div className="relative flex items-center gap-3">
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-md"
            style={{ backgroundColor: `rgba(${textColor === "#ffffff" ? "255,255,255" : "0,0,0"},0.15)`, color: textColor }}
          >
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-tight" style={{ color: textColor }}>
              {botName}
            </p>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
              <span className="text-xs opacity-80" style={{ color: textColor }}>
                Online · Typically replies instantly
              </span>
            </div>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 transition-colors hover:bg-black/10"
              style={{ color: textColor }}
              aria-label="Close"
            >
              <Minimize2 className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── Messages ────────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto bg-gray-50 px-4 py-4 scroll-smooth">
        {messages.map((msg) =>
          msg.role === "user" ? (
            <UserBubble key={msg.id} msg={msg} />
          ) : (
            <BotBubble
              key={msg.id}
              msg={msg}
              initial={initial}
              primaryColor={primaryColor}
              textColor={textColor}
              showTyping={!!msg.streaming}
            />
          )
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ───────────────────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-gray-100 bg-white px-3 py-3">
        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 transition-shadow focus-within:border-gray-300 focus-within:shadow-sm">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() } }}
            disabled={busy}
            placeholder="Type a message…"
            className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400 disabled:opacity-50"
          />
          <button
            type="button"
            onClick={send}
            disabled={busy || !input.trim()}
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-lg transition-all",
              "disabled:opacity-35 disabled:cursor-not-allowed",
              "hover:brightness-110 active:scale-95"
            )}
            style={{ backgroundColor: primaryColor, color: textColor }}
            aria-label="Send"
          >
            {busy
              ? <Loader2 className="size-3.5 animate-spin" />
              : <Send className="size-3.5" />
            }
          </button>
        </div>
        <p className="mt-2 text-center text-[10px] text-gray-300">
          Powered by <span className="font-medium text-gray-400">ChatBuilder</span>
        </p>
      </div>
    </div>
  )
}

// ── Floating widget wrapper (for non-embed / preview mode) ─────────────────────

export function FloatingChatWidget({ config }: { config: ChatConfig }) {
  const [open, setOpen] = useState(false)
  const { primaryColor } = config
  const textColor = contrastColor(primaryColor)

  const CHAT_ICON = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-6">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
  const CLOSE_ICON = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="size-5">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )

  return (
    <>
      {/* Chat panel */}
      <div
        className={cn(
          "fixed bottom-24 right-5 z-50 w-[380px] overflow-hidden rounded-2xl shadow-2xl ring-1 ring-black/8 transition-all duration-300",
          open
            ? "translate-y-0 scale-100 opacity-100 pointer-events-auto"
            : "translate-y-4 scale-95 opacity-0 pointer-events-none"
        )}
        style={{ height: "560px" }}
      >
        <ChatWindow config={config} onClose={() => setOpen(false)} />
      </div>

      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-50 flex size-14 items-center justify-center rounded-full shadow-xl ring-1 ring-black/10 transition-all duration-200 hover:scale-110 active:scale-95"
        style={{ backgroundColor: primaryColor, color: textColor }}
        aria-label={open ? "Close chat" : "Open chat"}
      >
        <span className={cn("absolute transition-all duration-200", open ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-90 scale-75")}>{CLOSE_ICON}</span>
        <span className={cn("absolute transition-all duration-200", open ? "opacity-0 -rotate-90 scale-75" : "opacity-100 rotate-0 scale-100")}>{CHAT_ICON}</span>
      </button>
    </>
  )
}
