import { Settings, User, Bell, Key, Palette } from "lucide-react"
import { Separator } from "@/components/ui/separator"

const settingSections = [
  {
    icon: User,
    title: "Account",
    description: "Manage your profile and account preferences",
  },
  {
    icon: Bell,
    title: "Notifications",
    description: "Configure how and when you receive notifications",
  },
  {
    icon: Key,
    title: "API Keys",
    description: "Generate and manage API keys for integrations",
  },
  {
    icon: Palette,
    title: "Appearance",
    description: "Customize the look and feel of the platform",
  },
]

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-8 p-8">
      <div className="flex items-center gap-3">
        <Settings className="size-6 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your workspace and account settings
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card shadow-sm">
        {settingSections.map(({ icon: Icon, title, description }, i) => (
          <div key={title}>
            {i > 0 && <Separator />}
            <button className="flex w-full items-center gap-4 px-6 py-5 text-left transition-colors hover:bg-muted/50">
              <div className="flex size-9 items-center justify-center rounded-md bg-muted">
                <Icon className="size-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-card-foreground">
                  {title}
                </p>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
