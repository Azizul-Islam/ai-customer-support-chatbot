"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Bot, Send, Circle, Check, RefreshCw, AlertCircle, Loader2, Copy, ExternalLink, Code2, User } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn, getInitials } from "@/lib/utils"
import {
  type Personality,
  PERSONALITY_META,
  PERSONALITY_OPTIONS,
  PREVIEW_CONVERSATIONS,
  DEFAULT_PERSONALITY,
  generateSystemPrompt,
} from "@/lib/chatbot-config"
import { saveChatbot, setChatbotKnowledgeSources } from "@/app/actions/chatbot"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Config {
  id?: string
  botName: string
  primaryColor: string
  welcomeMessage: string
  personality: Personality
  systemPrompt: string
  selectedSources: string[]
  defaultMode: "ai" | "human"
  status: "DRAFT" | "ACTIVE" | "ARCHIVED"
}

export interface InitialChatbotData {
  id?: string
  botName: string
  primaryColor: string
  welcomeMessage: string
  personality: Personality
  systemPrompt: string
  attachedSourceIds?: string[]
  defaultMode?: "ai" | "human"
  status?: "DRAFT" | "ACTIVE" | "ARCHIVED"
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

function defaultConfig(initial?: InitialChatbotData): Config {
  if (initial) {
    return {
      id: initial.id,
      botName: initial.botName,
      primaryColor: initial.primaryColor,
      welcomeMessage: initial.welcomeMessage,
      personality: initial.personality,
      systemPrompt: initial.systemPrompt,
      selectedSources: initial.attachedSourceIds ?? [],
      defaultMode: initial.defaultMode ?? "ai",
      status: initial.status ?? "DRAFT",
    }
  }
  return {
    botName: "Support Bot",
    primaryColor: "#6366f1",
    welcomeMessage: "Hi! How can I help you today? 👋",
    personality: DEFAULT_PERSONALITY,
    systemPrompt: generateSystemPrompt("Support Bot", DEFAULT_PERSONALITY),
    selectedSources: [],
    defaultMode: "ai",
    status: "DRAFT",
  }
}

export function ChatbotCustomizer({
  initialData,
  appUrl = "",
  availableSources = [],
}: {
  initialData?: InitialChatbotData
  appUrl?: string
  availableSources?: { id: string; name: string; status: string }[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [config, setConfig] = useState<Config>(defaultConfig(initialData))
  const [saveState, setSaveState] = useState<"idle" | "saved" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Debug: log what we're receiving
  console.log("COMPONENT mounted - initialData:", initialData)
  console.log("COMPONENT config.id:", config.id)

  const update = <K extends keyof Config>(key: K, value: Config[K]) =>
    setConfig((c) => ({ ...c, [key]: value }))

  const handlePersonalityChange = (p: Personality) => {
    setConfig((c) => ({
      ...c,
      personality: p,
      systemPrompt: generateSystemPrompt(c.botName, p),
    }))
  }

  const regeneratePrompt = () => {
    setConfig((c) => ({
      ...c,
      systemPrompt: generateSystemPrompt(c.botName, c.personality),
    }))
  }

  const handleSave = () => {
    setSaveState("idle")
    setErrorMsg(null)

    const botId = config.id
    const botName = config.botName
    const botStatus = config.status

    console.log("SAVING - botId:", botId, "botName:", botName, "status:", botStatus)

    startTransition(async () => {
      const result = await saveChatbot({
        id: botId,
        name: botName,
        primaryColor: config.primaryColor,
        welcomeMessage: config.welcomeMessage,
        personality: config.personality,
        systemPrompt: config.systemPrompt,
        defaultMode: config.defaultMode,
        status: config.status === "ACTIVE" ? "ACTIVE" : config.status === "ARCHIVED" ? "ARCHIVED" : "DRAFT",
      })

      if (!result.ok) {
        setSaveState("error")
        setErrorMsg(result.error)
        return
      }

      const chatbotId = result.chatbotId

      if (config.id && config.selectedSources) {
        await setChatbotKnowledgeSources(chatbotId, config.selectedSources)
      }

      setSaveState("saved")

      if (!config.id) {
        // New chatbot — update URL to edit mode
        setConfig((c) => ({ ...c, id: result.chatbotId }))
        router.replace(`/chatbots/customize?id=${result.chatbotId}`)
      }

      setTimeout(() => setSaveState("idle"), 2500)
    })
  }

  const primaryColor = isValidHex(config.primaryColor) ? config.primaryColor : "#6366f1"
  const textColor = useMemo(() => contrastColor(primaryColor), [primaryColor])
  const tint = useMemo(() => tintColor(primaryColor), [primaryColor])
  const initial = getInitials(config.botName, "B")
  const previewMessages = PREVIEW_CONVERSATIONS[config.personality]
  const meta = PERSONALITY_META[config.personality]

  return (
    <div className="flex min-h-full flex-col gap-8 p-8 lg:flex-row lg:items-start">
      {/* ── Left: Form ──────────────────────────────────────────────────── */}
      <div className="flex w-full flex-col gap-6 lg:max-w-sm xl:max-w-md">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {config.id ? "Edit Chatbot" : "Chatbot Customizer"}
          </h1>
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
                className="min-h-20 resize-none"
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
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="personality">AI Personality</Label>
              <Select
                id="personality"
                value={config.personality}
                onChange={(e) => handlePersonalityChange(e.target.value as Personality)}
              >
                {PERSONALITY_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {PERSONALITY_META[p].badge} {PERSONALITY_META[p].label} — {PERSONALITY_META[p].description}
                  </option>
                ))}
              </Select>

              <div className="flex items-center gap-2 rounded-md bg-muted/60 px-3 py-2">
                <span className="text-base">{meta.badge}</span>
                <div>
                  <p className="text-xs font-medium">{meta.label}</p>
                  <p className="text-xs text-muted-foreground">{meta.description}</p>
                </div>
              </div>
            </div>

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
                className="min-h-45 resize-y font-mono text-xs leading-relaxed"
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

        <Card>
          <CardHeader>
            <CardTitle>Default Conversation Mode</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-xs text-muted-foreground">
              Choose whether visitors talk to AI or a human agent by default.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => update("defaultMode", "ai")}
                className={cn(
                  "flex-1 rounded-lg border-2 p-3 text-center transition-colors",
                  config.defaultMode === "ai"
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                )}
              >
                <Bot className="mx-auto mb-1 size-5" />
                <span className="block text-sm font-medium">AI Assistant</span>
                <span className="block text-xs text-muted-foreground">
                  Chat with AI first
                </span>
              </button>
              <button
                type="button"
                onClick={() => update("defaultMode", "human")}
                className={cn(
                  "flex-1 rounded-lg border-2 p-3 text-center transition-colors",
                  config.defaultMode === "human"
                    ? "border-purple-500 bg-purple-50"
                    : "border-border hover:border-purple-500/50"
                )}
              >
                <User className="mx-auto mb-1 size-5" />
                <span className="block text-sm font-medium">Human Agent</span>
                <span className="block text-xs text-muted-foreground">
                  Direct to humans
                </span>
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Users can switch between AI and human in the chat widget.
            </p>
          </CardContent>
        </Card>

        {availableSources.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Knowledge Base</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="text-xs text-muted-foreground">
                Select which knowledge sources this chatbot can use to answer questions.
              </p>
              <div className="flex flex-col gap-2">
                {availableSources.map((source) => (
                  <label
                    key={source.id}
                    className="flex cursor-pointer items-center gap-2 rounded-md border border-border p-2 transition-colors hover:bg-muted/50"
                  >
                    <input
                      type="checkbox"
                      checked={config.selectedSources.includes(source.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          update("selectedSources", [...config.selectedSources, source.id])
                        } else {
                          update(
                            "selectedSources",
                            config.selectedSources.filter((id) => id !== source.id)
                          )
                        }
                      }}
                      className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm">{source.name}</span>
                  </label>
                ))}
              </div>
              {config.selectedSources.length === 0 && (
                <p className="text-xs text-amber-600">
                  No sources selected — the chatbot will not use your knowledge base.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {saveState === "error" && errorMsg && (
          <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            {errorMsg}
          </div>
        )}

        {config.id && (
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => update("status", "DRAFT")}
                  className={cn(
                    "flex-1 rounded-lg border-2 p-2 text-center transition-colors",
                    config.status === "DRAFT"
                      ? "border-gray-400 bg-gray-100"
                      : "border-border hover:border-gray-400"
                  )}
                >
                  <span className="block text-sm font-medium">Draft</span>
                </button>
                <button
                  type="button"
                  onClick={() => update("status", "ACTIVE")}
                  className={cn(
                    "flex-1 rounded-lg border-2 p-2 text-center transition-colors",
                    config.status === "ACTIVE"
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-border hover:border-emerald-500"
                  )}
                >
                  <span className="block text-sm font-medium">Active</span>
                </button>
                <button
                  type="button"
                  onClick={() => update("status", "ARCHIVED")}
                  className={cn(
                    "flex-1 rounded-lg border-2 p-2 text-center transition-colors",
                    config.status === "ARCHIVED"
                      ? "border-gray-400 bg-gray-100"
                      : "border-border hover:border-gray-400"
                  )}
                >
                  <span className="block text-sm font-medium">Archived</span>
                </button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Only ACTIVE chatbots can be embedded on websites.
              </p>
            </CardContent>
          </Card>
        )}

        <Button
          onClick={handleSave}
          disabled={isPending}
          className={cn(
            "w-full gap-2 transition-all",
            saveState === "saved" && "bg-emerald-600 hover:bg-emerald-600"
          )}
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Saving…
            </>
          ) : saveState === "saved" ? (
            <>
              <Check className="size-4" /> Saved
            </>
          ) : (
            "Save Changes"
          )}
        </Button>

        {/* ── Embed code card ─────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code2 className="size-4 text-muted-foreground" />
              Embed on Your Website
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {config.id ? (
              <>
                <p className="text-xs text-muted-foreground">
                  Paste this snippet before the closing{" "}
                  <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">&lt;/body&gt;</code>{" "}
                  tag on any page.
                </p>
                <div className="group relative">
                  <pre className="overflow-x-auto rounded-md border border-border bg-muted px-3 py-3 font-mono text-[11px] leading-relaxed text-foreground">
{`<script\n  src="${appUrl}/loader.js"\n  data-chatbot-id="${config.id}"\n></script>`}
                  </pre>
                  <button
                    type="button"
                    onClick={() => {
                      const snippet = `<script\n  src="${appUrl}/loader.js"\n  data-chatbot-id="${config.id}"\n></script>`
                      navigator.clipboard.writeText(snippet).then(() => {
                        setCopied(true)
                        setTimeout(() => setCopied(false), 2000)
                      })
                    }}
                    className="absolute right-2 top-2 rounded-md border border-border bg-background p-1.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground"
                    title="Copy snippet"
                  >
                    {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => {
                      const snippet = `<script\n  src="${appUrl}/loader.js"\n  data-chatbot-id="${config.id}"\n></script>`
                      navigator.clipboard.writeText(snippet).then(() => {
                        setCopied(true)
                        setTimeout(() => setCopied(false), 2000)
                      })
                    }}
                  >
                    {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                    {copied ? "Copied!" : "Copy Code"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-xs text-muted-foreground"
                    asChild
                  >
                    <a href={`/chatbot/${config.id}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="size-3.5" />
                      Preview
                    </a>
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Save your chatbot to get the embed code.
              </p>
            )}
          </CardContent>
        </Card>
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
