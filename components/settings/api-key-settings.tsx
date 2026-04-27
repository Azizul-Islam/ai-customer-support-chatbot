"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Key, Trash2, Copy, Check } from "lucide-react"

interface ApiKey {
  id: string
  name: string
  keyPrefix: string
  createdAt: string
  expiresAt: string | null
  lastUsedAt: string | null
}

interface ApiKeySettingsProps {
  initialKeys: ApiKey[]
}

export function ApiKeySettings({ initialKeys }: ApiKeySettingsProps) {
  const [keys, setKeys] = useState<ApiKey[]>(initialKeys)
  const [newKeyName, setNewKeyName] = useState("")
  const [newKey, setNewKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleCreate = async () => {
    if (!newKeyName.trim()) return
    setCreating(true)
    try {
      const res = await fetch("/api/settings/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName }),
      })
      const data = await res.json()
      if (data.ok) {
        setNewKey(data.key)
        setNewKeyName("")
        setKeys([
          {
            id: data.key.split(".")[0],
            name: newKeyName,
            keyPrefix: data.keyPrefix,
            createdAt: new Date().toISOString(),
            expiresAt: null,
            lastUsedAt: null,
          },
          ...keys,
        ])
      }
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    try {
      const res = await fetch(`/api/settings/api-keys?id=${id}`, { method: "DELETE" })
      if (res.ok) {
        setKeys(keys.filter((k) => k.id !== id))
      }
    } finally {
      setDeleting(null)
    }
  }

  const copyKey = () => {
    if (newKey) {
      navigator.clipboard.writeText(newKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">API Keys</h2>
        <p className="text-sm text-muted-foreground">Generate and manage API keys for integrations</p>
      </div>

      {newKey && (
        <div className="rounded-md border border-green-200 bg-green-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-green-800">API Key Created</p>
              <p className="text-sm text-green-700">
                Copy this key now. You won&apos;t be able to see it again.
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <code className="flex-1 rounded bg-white px-3 py-2 text-sm font-mono">{newKey}</code>
            <Button variant="outline" size="sm" onClick={copyKey}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 text-green-700"
            onClick={() => setNewKey(null)}
          >
            I&apos;ve saved my key
          </Button>
        </div>
      )}

      <div className="flex items-end gap-4 max-w-md">
        <div className="flex-1">
          <Label htmlFor="keyName">Key Name</Label>
          <Input
            id="keyName"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="e.g., Production API"
            className="mt-1"
          />
        </div>
        <Button onClick={handleCreate} disabled={creating || !newKeyName.trim()}>
          {creating ? "Creating..." : "Create Key"}
        </Button>
      </div>

      <div className="rounded-md border">
        {keys.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Key className="mx-auto h-8 w-8 opacity-50" />
            <p className="mt-2 text-sm">No API keys yet</p>
          </div>
        ) : (
          <div className="divide-y">
            {keys.map((key) => (
              <div key={key.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{key.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {key.keyPrefix}... • Created {new Date(key.createdAt).toLocaleDateString()}
                    {key.expiresAt && ` • Expires ${new Date(key.expiresAt).toLocaleDateString()}`}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(key.id)}
                  disabled={deleting === key.id}
                >
                  {deleting === key.id ? (
                    <span className="h-4 w-4 animate-spin">...</span>
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}