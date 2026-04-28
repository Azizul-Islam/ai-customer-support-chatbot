import { Settings, Building2, Bell, Palette, Bot, Users } from "lucide-react"
import { notFound, redirect } from "next/navigation"
import { loadSettingsData } from "@/app/actions/settings-loader"
import { WorkspaceSettings } from "@/components/settings/workspace-settings"
import { MembersSettings } from "@/components/settings/members-settings"
import { NotificationSettings } from "@/components/settings/notification-settings"
import { AppearanceSettings } from "@/components/settings/appearance-settings"
import { AiSettings } from "@/components/settings/ai-settings"
import { listMembers } from "@/app/actions/members"
import { getOrProvisionWorkspace } from "@/lib/workspace"

export const metadata = {
  title: "Settings — SupportIQ",
}

const sections = [
  {
    id: "workspace",
    icon: Building2,
    title: "Workspace",
    description: "Manage your workspace details",
  },
  {
    id: "members",
    icon: Users,
    title: "Team Members",
    description: "Manage who can access this workspace",
  },
  {
    id: "ai",
    icon: Bot,
    title: "AI Configuration",
    description: "Configure AI provider and models for your chatbots",
  },
  {
    id: "notifications",
    icon: Bell,
    title: "Notifications",
    description: "Configure how and when you receive notifications",
  },
  {
    id: "appearance",
    icon: Palette,
    title: "Appearance",
    description: "Customize the look and feel of the platform",
  },
]

export default async function SettingsPage() {
  const ctx = await getOrProvisionWorkspace()
  if (!ctx) redirect("/login")
  if (ctx.role === "MEMBER") redirect("/conversations")

  const data = await loadSettingsData()
  if (!data) notFound()

  const membersData = await listMembers()

  return (
    <div className="flex flex-col gap-8 p-8">
      <div className="flex items-center gap-3">
        <Settings className="size-6 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your workspace and preferences
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <nav className="flex flex-col gap-1">
          {sections.map(({ id, icon: Icon, title }) => (
            <a
              key={id}
              href={`#${id}`}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
            >
              <Icon className="h-4 w-4" />
              {title}
            </a>
          ))}
        </nav>

        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <div id="workspace">
            <WorkspaceSettings
              initialData={{
                name: data.workspace.name,
                slug: data.workspace.slug,
              }}
            />
          </div>

          <div className="my-8 border-t" />

          <div id="members">
            <MembersSettings
              initialMembers={membersData.members ?? []}
              initialRole={membersData.currentRole ?? "MEMBER"}
            />
          </div>

          <div className="my-8 border-t" />

          <div id="ai">
            <AiSettings initialData={data.ai} />
          </div>

          <div className="my-8 border-t" />

          <div id="notifications">
            <NotificationSettings initialData={data.notifications} />
          </div>

          <div className="my-8 border-t" />

          <div id="appearance">
            <AppearanceSettings initialData={data.appearance} />
          </div>
        </div>
      </div>
    </div>
  )
}