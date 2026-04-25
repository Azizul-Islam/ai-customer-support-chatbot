"use client"

import { useMemo, useState } from "react"
import { Bot, Send, Circle, Check, RefreshCw } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

// ─── Personality ──────────────────────────────────────────────────────────────

export type Personality = "friendly" | "professional" | "strict"

interface PersonalityMeta {
  label: string
  badge: string
  description: string
}

const PERSONALITY_META: Record<Personality, PersonalityMeta> = {
  friendly: {
    label: "Friendly",
    badge: "😊",
    description: "Warm, casual, and encouraging",
  },
  professional: {
    label: "Professional",
    badge: "💼",
    description: "Formal, precise, and efficient",
  },
  strict: {
    label: "Strict",
    badge: "🎯",
    description: "Focused, direct, and on-topic only",
  },
}

export function generateSystemPrompt(botName: string, personality: Personality): string {
  const name = botName.trim() || "Support Bot"

  switch (personality) {
    case "friendly":
      return `You are ${name}, a friendly and enthusiastic support assistant.

Your tone is warm, approachable, and encouraging. You make users feel heard and valued.

Guidelines:
- Greet users warmly; use their name when possible
- Acknowledge frustrations with empathy before offering solutions
- Use everyday language — avoid jargon
- Occasionally use relevant emojis to keep the tone light
- Keep answers concise but kind
- Always end with an offer to help further`

    case "professional":
      return `You are ${name}, a professional customer support representative.

Your communication is formal, precise, and respects the user's time.

Guidelines:
- Use formal language and correct grammar at all times
- Be concise — complete answers without unnecessary elaboration
- Do not use emojis, slang, or overly casual expressions
- Address each point in the user's query systematically
- If escalation is needed, provide clear next steps and timelines
- Close each interaction professionally`

    case "strict":
      return `You are ${name}, a focused support assistant with a strictly defined scope.

You answer only questions directly related to the product or service. You do not engage in small talk or requests outside your domain.

Guidelines:
- Answer only questions within your designated scope
- Refuse off-topic requests firmly: "I can only assist with product-related queries."
- Provide direct, factual answers — no filler or pleasantries
- Do not speculate or answer hypotheticals outside your knowledge base
- If a question is out of scope, state clearly what you can help with
- Never make exceptions to these boundaries`
  }
}

// ─── Preview conversation per personality ────────────────────────────────────

type Message = { role: "bot" | "user"; text: string }

const PREVIEW_CONVERSATIONS: Record<Personality, Message[]> = {
  friendly: [
    { role: "user", text: "I need help with my subscription." },
    {
      role: "bot",
      text: "Of course, I'd love to help! 😊 Which plan are you currently on?",
    },
    { role: "user", text: "I'm on the Pro plan." },
    {
      role: "bot",
      text: "Awesome — Pro users get priority support! What can I sort out for you today? 🎉",
    },
  ],
  professional: [
    { role: "user", text: "I need help with my subscription." },
    {
      role: "bot",
      text: "I can assist you with that. Please confirm which subscription plan you are currently enrolled in.",
    },
    { role: "user", text: "I'm on the Pro plan." },
    {
      role: "bot",
      text: "Thank you. Please specify the issue you are experiencing with your Pro subscription.",
    },
  ],
  strict: [
    { role: "user", text: "I need help with my subscription." },
    { role: "bot", text: "State your account issue." },
    { role: "user", text: "I'm on the Pro plan." },
    {
      role: "bot",
      text: "Pro plan queries accepted. Describe the specific problem.",
    },
  ],
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Config {
  botName: string
  primaryColor: string
  welcomeMessage: string
  personality: Personality
  systemPrompt: string
}

// ─── Color helpers ────────────────────────────────────────────────────────────

function isValidHex(hex: string) {
  return /^#[0-9a-fA-F]{6}$/.test(hex)
}

function contrastColor(hex: string): string {
  if (!isValidHex(hex)) return "#ffffff"
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55 ? "#111827" : "#ffffff"
}

function tintColor(hex: string): string {
  return isValidHex(hex) ? `${hex}1F` : "#6366f11F"
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function BotBubble({
  text,
  initial,
  primaryColor,
  textColor,
}: {
  text: string
  initial: string
  primaryColor: string
  textColor: string
}) {
  return (
    <div className="flex items-end gap-2">
      <div
        className="flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
        style={{ backgroundColor: primaryColor, color: textColor }}
      >
        {initial}
      </div>
      <div
        className="max-w-[78%] rounded-2xl rounded-bl-sm px-3.5 py-2.5 text-sm leading-relaxed"
        style={{ backgroundColor: primaryColor, color: textColor }}
      >
        {text}
      </div>
    </div>
  )
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[78%] rounded-2xl rounded-br-sm bg-white px-3.5 py-2.5 text-sm leading-relaxed text-gray-800 shadow-sm">
        {text}
      </div>
    </div>
  )
}

function ColorField({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const handleText = (raw: string) => {
    onChange(raw.startsWith("#") ? raw : `#${raw}`)
  }

  return (
    <div className="flex items-center gap-2.5">
      <label className="relative shrink-0 cursor-pointer">
        <div
          className="size-9 rounded-md border border-input shadow-sm transition-transform hover:scale-105"
          style={{ backgroundColor: isValidHex(value) ? value : "#6366f1" }}
        />
        <input
          type="color"
          value={isValidHex(value) ? value : "#6366f1"}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          aria-label="Pick color"
        />
      </label>
      <Input
        value={value}
        onChange={(e) => handleText(e.target.value)}
        placeholder="#6366f1"
        maxLength={7}
        className="font-mono uppercase tracking-wider"
      />
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

const DEFAULT_PERSONALITY: Personality = "friendly"

export function ChatbotCustomizer() {
  const [config, setConfig] = useState<Config>({
    botName: "Support Bot",
    primaryColor: "#6366f1",
    welcomeMessage: "Hi! How can I help you today? 👋",
    personality: DEFAULT_PERSONALITY,
    systemPrompt: generateSystemPrompt("Support Bot", DEFAULT_PERSONALITY),
  })
  const [saved, setSaved] = useState(false)

  const update = <K extends keyof Config>(key: K, value: Config[K]) =>
    setConfig((c) => ({ ...c, [key]: value }))

  // Switching personality auto-regenerates the prompt
  const handlePersonalityChange = (p: Personality) => {
    setConfig((c) => ({
      ...c,
      personality: p,
      systemPrompt: generateSystemPrompt(c.botName, p),
    }))
  }

  // Regenerate from current botName + personality (for the button)
  const regeneratePrompt = () => {
    setConfig((c) => ({
      ...c,
      systemPrompt: generateSystemPrompt(c.botName, c.personality),
    }))
  }

  const primaryColor = isValidHex(config.primaryColor) ? config.primaryColor : "#6366f1"
  const textColor = useMemo(() => contrastColor(primaryColor), [primaryColor])
  const tint = useMemo(() => tintColor(primaryColor), [primaryColor])
  const initial = (config.botName || "B").charAt(0).toUpperCase()
  const previewMessages = PREVIEW_CONVERSATIONS[config.personality]
  const meta = PERSONALITY_META[config.personality]

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex min-h-full flex-col gap-8 p-8 lg:flex-row lg:items-start">
      {/* ── Left: Form ──────────────────────────────────────────────────── */}
      <div className="flex w-full flex-col gap-6 lg:max-w-sm xl:max-w-md">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Chatbot Customizer</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure your chatbot&apos;s identity, appearance, and behavior.
          </p>
        </div>

        {/* Identity card */}
        <Card>
          <CardHeader>
            <CardTitle>Identity &amp; Appearance</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bot-name">Bot Name</Label>
              <Input
                id="bot-name"
                value={config.botName}
                onChange={(e) => update("botName", e.target.value)}
                placeholder="Support Bot"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Primary Color</Label>
              <ColorField
                value={config.primaryColor}
                onChange={(v) => update("primaryColor", v)}
              />
              <p className="text-xs text-muted-foreground">
                Used for the chat header, bot bubbles, and send button.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="welcome-msg">Welcome Message</Label>
              <Textarea
                id="welcome-msg"
                value={config.welcomeMessage}
                onChange={(e) => update("welcomeMessage", e.target.value)}
                placeholder="Hi! How can I help you today?"
                className="min-h-[80px] resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Shown when users first open the chat.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Behavior card */}
        <Card>
          <CardHeader>
            <CardTitle>Behavior &amp; Personality</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {/* Personality picker */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="personality">AI Personality</Label>
              <Select
                id="personality"
                value={config.personality}
                onChange={(e) => handlePersonalityChange(e.target.value as Personality)}
              >
                {(Object.keys(PERSONALITY_META) as Personality[]).map((p) => (
                  <option key={p} value={p}>
                    {PERSONALITY_META[p].badge} {PERSONALITY_META[p].label} — {PERSONALITY_META[p].description}
                  </option>
                ))}
              </Select>

              {/* Personality badge strip */}
              <div className="flex items-center gap-2 rounded-md bg-muted/60 px-3 py-2">
                <span className="text-base">{meta.badge}</span>
                <div>
                  <p className="text-xs font-medium">{meta.label}</p>
                  <p className="text-xs text-muted-foreground">{meta.description}</p>
                </div>
              </div>
            </div>

            {/* System prompt */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="system-prompt">System Prompt</Label>
                <button
                  type="button"
                  onClick={regeneratePrompt}
                  className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                  title="Reset to personality default"
                >
                  <RefreshCw className="size-3" />
                  Regenerate
                </button>
              </div>
              <Textarea
                id="system-prompt"
                value={config.systemPrompt}
                onChange={(e) => update("systemPrompt", e.target.value)}
                className="min-h-[180px] resize-y font-mono text-xs leading-relaxed"
              />
              <p className="text-xs text-muted-foreground">
                Sent as the{" "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
                  system
                </code>{" "}
                message to OpenAI. Switching personality regenerates this — you can edit freely.
              </p>
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={handleSave}
          className={cn(
            "w-full gap-2 transition-all",
            saved && "bg-emerald-600 hover:bg-emerald-600"
          )}
        >
          {saved ? (
            <>
              <Check className="size-4" /> Saved
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>

      {/* ── Right: Live Preview ─────────────────────────────────────────── */}
      <div className="flex w-full flex-col gap-4 lg:sticky lg:top-8">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm font-semibold">Live Preview</p>
            <p className="text-xs text-muted-foreground">
              Conversation updates per personality.
            </p>
          </div>
          <span className="rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs font-medium">
            {meta.badge} {meta.label}
          </span>
        </div>

        <div className="mx-auto w-full max-w-sm overflow-hidden rounded-2xl border border-border shadow-2xl">
          {/* Header */}
          <div
            className="flex items-center gap-3 px-4 py-3"
            style={{ backgroundColor: primaryColor, color: textColor }}
          >
            <div
              className="flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold"
              style={{ backgroundColor: tint, color: textColor }}
            >
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold leading-none">
                {config.botName || "Bot"}
              </p>
              <div className="mt-1.5 flex items-center gap-1">
                <Circle className="size-2 fill-emerald-400 text-emerald-400" />
                <span className="text-xs opacity-75">Online</span>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex flex-col gap-3 bg-gray-50 px-4 py-4">
            <BotBubble
              text={config.welcomeMessage || "Hi! How can I help?"}
              initial={initial}
              primaryColor={primaryColor}
              textColor={textColor}
            />

            {previewMessages.map((msg, i) =>
              msg.role === "user" ? (
                <UserBubble key={i} text={msg.text} />
              ) : (
                <BotBubble
                  key={i}
                  text={msg.text}
                  initial={initial}
                  primaryColor={primaryColor}
                  textColor={textColor}
                />
              )
            )}

            {/* Typing indicator */}
            <div className="flex items-end gap-2">
              <div
                className="flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                style={{ backgroundColor: primaryColor, color: textColor }}
              >
                {initial}
              </div>
              <div
                className="flex items-center gap-1 rounded-2xl rounded-bl-sm px-3.5 py-3"
                style={{ backgroundColor: primaryColor }}
              >
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="block size-1.5 animate-bounce rounded-full"
                    style={{
                      backgroundColor: textColor,
                      opacity: 0.7,
                      animationDelay: `${i * 150}ms`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Input bar */}
          <div className="flex items-center gap-2 border-t border-border bg-background px-3 py-2.5">
            <input
              readOnly
              className="flex-1 cursor-default select-none bg-transparent text-sm text-muted-foreground outline-none"
              placeholder="Type a message..."
            />
            <button
              type="button"
              className="flex size-8 shrink-0 items-center justify-center rounded-full transition-opacity hover:opacity-90"
              style={{ backgroundColor: primaryColor, color: textColor }}
              tabIndex={-1}
            >
              <Send className="size-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
