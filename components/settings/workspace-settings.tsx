"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Building2 } from "lucide-react"

interface WorkspaceSettingsProps {
  initialData: {
    name: string
    slug: string
  }
}

export function WorkspaceSettings({ initialData }: WorkspaceSettingsProps) {
  const [name, setName] = useState(initialData.name)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      const res = await fetch("/api/settings/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Workspace</h2>
        <p className="text-sm text-muted-foreground">
          Manage your workspace details
        </p>
      </div>

      <div className="grid gap-4 max-w-md">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-medium">Workspace Name</Label>
          </div>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter workspace name"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Workspace URL</Label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">onedesk.app/</span>
            <Input
              value={initialData.slug}
              disabled
              className="bg-muted"
            />
          </div>
          <p className="text-xs text-muted-foreground">Workspace URL cannot be changed</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={handleSave} disabled={saving || !name.trim()}>
          {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
        </Button>
      </div>
    </div>
  )
}