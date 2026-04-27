import { db } from "@/lib/db"
import { getOrProvisionWorkspace } from "@/lib/workspace"

export async function loadSettingsData() {
  const ctx = await getOrProvisionWorkspace()
  if (!ctx) return null

  const [user, userSettings, workspaceSettings, apiKeys] = await Promise.all([
    db.user.findUnique({
      where: { id: ctx.user.id },
      select: { id: true, name: true, email: true, avatarUrl: true },
    }),
    db.userSettings.findUnique({
      where: { userId: ctx.user.id },
    }),
    db.workspaceSettings.findUnique({
      where: { workspaceId: ctx.workspace.id },
    }),
    db.apiKey.findMany({
      where: { workspaceId: ctx.workspace.id },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        createdAt: true,
        expiresAt: true,
        lastUsedAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ])

  if (!user) return null

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
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
    apiKeys: apiKeys.map((k) => ({
      ...k,
      createdAt: k.createdAt.toISOString(),
      expiresAt: k.expiresAt?.toISOString() ?? null,
      lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
    })),
  }
}