"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Palette, Type, Paintbrush } from "lucide-react"

interface AppearanceSettingsProps {
  initialData: {
    primaryColor: string
    backgroundColor: string
    fontFamily: string
    theme: string
  }
}

const FONTS = [
  { value: "inter", label: "Inter" },
  { value: "system-ui", label: "System UI" },
  { value: "geist", label: "Geist" },
  { value: "roboto", label: "Roboto" },
  { value: "open-sans", label: "Open Sans" },
]

const THEMES = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
]

const COLORS = [
  { value: "#6366f1", label: "Indigo", css: "bg-indigo-500" },
  { value: "#3b82f6", label: "Blue", css: "bg-blue-500" },
  { value: "#10b981", label: "Emerald", css: "bg-emerald-500" },
  { value: "#f59e0b", label: "Amber", css: "bg-amber-500" },
  { value: "#ef4444", label: "Red", css: "bg-red-500" },
  { value: "#8b5cf6", label: "Violet", css: "bg-violet-500" },
  { value: "#ec4899", label: "Pink", css: "bg-pink-500" },
  { value: "#14b8a6", label: "Teal", css: "bg-teal-500" },
]

export function AppearanceSettings({ initialData }: AppearanceSettingsProps) {
  const [primaryColor, setPrimaryColor] = useState(initialData.primaryColor)
  const [backgroundColor, setBackgroundColor] = useState(initialData.backgroundColor)
  const [fontFamily, setFontFamily] = useState(initialData.fontFamily)
  const [theme, setTheme] = useState(initialData.theme)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await Promise.all([
        fetch("/api/settings/workspace-appearance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ primaryColor, backgroundColor, fontFamily }),
        }),
        fetch("/api/settings/theme", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ theme }),
        }),
      ])
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Appearance</h2>
        <p className="text-sm text-muted-foreground">Customize the look and feel of the platform</p>
      </div>

      <div className="space-y-6 max-w-md">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-medium">Theme</Label>
          </div>
          <Select value={theme} onChange={(e) => setTheme(e.target.value)}>
            {THEMES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Paintbrush className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-medium">Primary Color</Label>
          </div>
          <div className="flex gap-2">
            {COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => setPrimaryColor(c.value)}
                className={`h-8 w-8 rounded-full ${c.css} transition-transform hover:scale-110 ${
                  primaryColor === c.value ? "ring-2 ring-offset-2 ring-primary" : ""
                }`}
                title={c.label}
              />
            ))}
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="h-8 w-8 rounded cursor-pointer"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-medium">Background Color</Label>
          </div>
          <div className="flex gap-2">
            {["#ffffff", "#f9fafb", "#f3f4f6", "#e5e7eb", "#1f2937", "#111827"].map((c) => (
              <button
                key={c}
                onClick={() => setBackgroundColor(c)}
                className={`h-8 w-8 rounded border transition-transform hover:scale-110 ${
                  backgroundColor === c ? "ring-2 ring-primary" : ""
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Type className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-medium">Font Family</Label>
          </div>
          <Select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)}>
            {FONTS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
        </Button>
      </div>

      <div className="rounded-lg border p-6" style={{ backgroundColor }}>
        <div className="space-y-2">
          <p className="text-sm" style={{ color: primaryColor }}>
            Sample primary text
          </p>
          <p className="text-lg font-semibold">Preview Card</p>
          <p className="text-sm text-muted-foreground">
            This is how your chatbot widgets will appear with these colors.
          </p>
          <div className="flex gap-2">
            <div
              className="rounded px-3 py-1 text-sm font-medium text-white"
              style={{ backgroundColor: primaryColor }}
            >
              Primary
            </div>
            <div className="rounded border border-border px-3 py-1 text-sm">Secondary</div>
          </div>
        </div>
      </div>
    </div>
  )
}