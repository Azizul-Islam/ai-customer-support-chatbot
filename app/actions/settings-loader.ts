import { db } from "@/lib/db"
import { getOrProvisionWorkspace } from "@/lib/workspace"

export async function loadSettingsData() {
  const ctx = await getOrProvisionWorkspace()
  if (!ctx) return null

  const [workspace, userSettings, workspaceSettings] = await Promise.all([
    db.workspace.findUnique({
      where: { id: ctx.workspace.id },
      select: { id: true, name: true, slug: true },
    }),
    db.userSettings.findUnique({
      where: { userId: ctx.user.id },
    }),
    db.workspaceSettings.findUnique({
      where: { workspaceId: ctx.workspace.id },
    }),
  ])

  if (!workspace) return null

  return {
    workspace: {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
    },
    notifications: {
      emailNotifications: userSettings?.emailNotifications ?? true,
      pushNotifications: userSettings?.pushNotifications ?? true,
      notificationFrequency: userSettings?.notificationFrequency ?? "instant",
    },
    appearance: {
      primaryColor: workspaceSettings?.primaryColor ?? "#6366f1",
      backgroundColor: workspaceSettings?.backgroundColor ?? "#ffffff",
      fontFamily: workspaceSettings?.fontFamily ?? "inter",
      theme: userSettings?.theme ?? "system",
    },
    ai: {
      aiProvider: workspaceSettings?.aiProvider ?? "OPENROUTER",
      aiModel: workspaceSettings?.aiModel ?? "meta-llama/llama-3.3-70b-instruct:free",
      aiApiKey: workspaceSettings?.aiApiKey ?? null,
    },
  }
}