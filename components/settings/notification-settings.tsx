"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Bell, Mail, Smartphone } from "lucide-react"

interface NotificationSettingsProps {
  initialData: {
    emailNotifications: boolean
    pushNotifications: boolean
    notificationFrequency: string
  }
}

export function NotificationSettings({ initialData }: NotificationSettingsProps) {
  const [emailNotifications, setEmailNotifications] = useState(initialData.emailNotifications)
  const [pushNotifications, setPushNotifications] = useState(initialData.pushNotifications)
  const [frequency, setFrequency] = useState(initialData.notificationFrequency)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/settings/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailNotifications,
          pushNotifications,
          notificationFrequency: frequency,
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Notifications</h2>
        <p className="text-sm text-muted-foreground">Configure how and when you receive notifications</p>
      </div>

      <div className="space-y-4 max-w-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-md bg-muted">
              <Mail className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <Label className="text-sm font-medium">Email Notifications</Label>
              <p className="text-xs text-muted-foreground">Receive updates via email</p>
            </div>
          </div>
          <button
            onClick={() => setEmailNotifications(!emailNotifications)}
            className={`relative h-6 w-11 rounded-full transition-colors ${
              emailNotifications ? "bg-primary" : "bg-muted"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                emailNotifications ? "left-5" : "left-0.5"
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-md bg-muted">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <Label className="text-sm font-medium">Push Notifications</Label>
              <p className="text-xs text-muted-foreground">Receive push notifications</p>
            </div>
          </div>
          <button
            onClick={() => setPushNotifications(!pushNotifications)}
            className={`relative h-6 w-11 rounded-full transition-colors ${
              pushNotifications ? "bg-primary" : "bg-muted"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                pushNotifications ? "left-5" : "left-0.5"
              }`}
            />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-md bg-muted">
            <Bell className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <Label className="text-sm font-medium">Notification Frequency</Label>
            <Select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="mt-1"
            >
              <option value="instant">Instant</option>
              <option value="hourly">Hourly Digest</option>
              <option value="daily">Daily Digest</option>
              <option value="weekly">Weekly Digest</option>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
        </Button>
      </div>
    </div>
  )
}