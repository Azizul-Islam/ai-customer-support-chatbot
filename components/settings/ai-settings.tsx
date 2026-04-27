"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Bot, Key, Settings2 } from "lucide-react"

interface AiSettingsProps {
  initialData: {
    aiProvider: string
    aiModel: string | null
    aiApiKey: string | null
  }
}

const PROVIDERS = [
  { value: "OPENROUTER", label: "OpenRouter (Free)", models: [
    { value: "meta-llama/llama-3.3-70b-instruct:free", label: "Llama 3.3 70B (Free)" },
    { value: "google/gemini-2.0-flash-exp:free", label: "Gemini 2.0 (Free)" },
    { value: "deepseek/deepseek-chat:free", label: "DeepSeek Chat (Free)" },
    { value: "qwen/qwen2.5-72b-instruct:free", label: "Qwen 2.5 (Free)" },
  ]},
  { value: "OPENAI", label: "OpenAI", models: [
    { value: "gpt-4o", label: "GPT-4o" },
    { value: "gpt-4o-mini", label: "GPT-4o Mini" },
    { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
  ]},
  { value: "ANTHROPIC", label: "Anthropic (Claude)", models: [
    { value: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet" },
    { value: "claude-3-opus-20240229", label: "Claude 3 Opus" },
    { value: "claude-3-haiku-20240307", label: "Claude 3 Haiku" },
  ]},
]

export function AiSettings({ initialData }: AiSettingsProps) {
  const [provider, setProvider] = useState(initialData.aiProvider)
  const [model, setModel] = useState(initialData.aiModel ?? "")
  const [apiKey, setApiKey] = useState(initialData.aiApiKey ?? "")
  const [showKey, setShowKey] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const currentProvider = PROVIDERS.find(p => p.value === provider)
  const availableModels = currentProvider?.models ?? []

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/settings/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aiProvider: provider,
          aiModel: model,
          aiApiKey: apiKey || null,
        }),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } finally {
      setSaving(false)
    }
  }

  const handleProviderChange = (newProvider: string) => {
    setProvider(newProvider)
    const prov = PROVIDERS.find(p => p.value === newProvider)
    if (prov && prov.models.length > 0) {
      setModel(prov.models[0].value)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">AI Configuration</h2>
        <p className="text-sm text-muted-foreground">
          Configure the AI model your chatbots will use
        </p>
      </div>

      <div className="space-y-4 max-w-md">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-medium">AI Provider</Label>
          </div>
          <Select value={provider} onChange={(e) => handleProviderChange(e.target.value)}>
            {PROVIDERS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-medium">Model</Label>
          </div>
          <Select value={model} onChange={(e) => setModel(e.target.value)}>
            {availableModels.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </Select>
        </div>

        
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-medium">API Key</Label>
            </div>
            <div className="relative">
              <Input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={provider === "OPENAI" ? "sk-..." : "sk-ant-..."}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? "Hide" : "Show"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Leave empty to use environment API keys
            </p>
          </div>

        
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
        </Button>
      </div>

      <div className="rounded-lg border p-4">
        <p className="text-sm font-medium">Current Configuration</p>
        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Provider:</span>
            <span className="ml-2">{PROVIDERS.find(p => p.value === provider)?.label}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Model:</span>
            <span className="ml-2">{availableModels.find(m => m.value === model)?.label ?? model}</span>
          </div>
        </div>
      </div>
    </div>
  )
}