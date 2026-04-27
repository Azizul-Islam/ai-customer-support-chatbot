"use server"

import { db } from "@/lib/db"
import { getOrProvisionWorkspace } from "@/lib/workspace"
import { randomBytes } from "crypto"

export async function getUserSettings() {
  const ctx = await getOrProvisionWorkspace()
  if (!ctx) return null

  let settings = await db.userSettings.findUnique({
    where: { userId: ctx.user.id },
  })

  if (!settings) {
    settings = await db.userSettings.create({
      data: { userId: ctx.user.id },
    })
  }

  return settings
}

export async function updateUserProfile(data: { name?: string; avatarUrl?: string }) {
  const ctx = await getOrProvisionWorkspace()
  if (!ctx) return { ok: false, error: "Not authenticated" }

  try {
    await db.user.update({
      where: { id: ctx.user.id },
      data: { name: data.name },
    })

    let settings = await db.userSettings.findUnique({
      where: { userId: ctx.user.id },
    })

    if (!settings) {
      settings = await db.userSettings.create({
        data: { userId: ctx.user.id, avatarUrl: data.avatarUrl },
      })
    } else if (data.avatarUrl !== undefined) {
      await db.userSettings.update({
        where: { userId: ctx.user.id },
        data: { avatarUrl: data.avatarUrl },
      })
    }

    return { ok: true }
  } catch (err) {
    console.error("[updateUserProfile]", err)
    return { ok: false, error: "Failed to update profile" }
  }
}

export async function updateNotificationSettings(data: {
  emailNotifications?: boolean
  pushNotifications?: boolean
  notificationFrequency?: string
}) {
  const ctx = await getOrProvisionWorkspace()
  if (!ctx) return { ok: false, error: "Not authenticated" }

  try {
    let settings = await db.userSettings.findUnique({
      where: { userId: ctx.user.id },
    })

    if (!settings) {
      settings = await db.userSettings.create({
        data: { userId: ctx.user.id, ...data },
      })
    } else {
      await db.userSettings.update({
        where: { userId: ctx.user.id },
        data,
      })
    }

    return { ok: true }
  } catch (err) {
    console.error("[updateNotificationSettings]", err)
    return { ok: false, error: "Failed to update notifications" }
  }
}

export async function updateUserTheme(theme: string) {
  const ctx = await getOrProvisionWorkspace()
  if (!ctx) return { ok: false, error: "Not authenticated" }

  try {
    let settings = await db.userSettings.findUnique({
      where: { userId: ctx.user.id },
    })

    if (!settings) {
      await db.userSettings.create({
        data: { userId: ctx.user.id, theme },
      })
    } else {
      await db.userSettings.update({
        where: { userId: ctx.user.id },
        data: { theme },
      })
    }

    return { ok: true }
  } catch (err) {
    console.error("[updateUserTheme]", err)
    return { ok: false, error: "Failed to update theme" }
  }
}

export async function getWorkspaceSettings() {
  const ctx = await getOrProvisionWorkspace()
  if (!ctx) return null

  let settings = await db.workspaceSettings.findUnique({
    where: { workspaceId: ctx.workspace.id },
  })

  if (!settings) {
    settings = await db.workspaceSettings.create({
      data: { workspaceId: ctx.workspace.id },
    })
  }

  return settings
}

export async function updateWorkspaceAppearance(data: {
  primaryColor?: string
  backgroundColor?: string
  fontFamily?: string
}) {
  const ctx = await getOrProvisionWorkspace()
  if (!ctx) return { ok: false, error: "Not authenticated" }

  try {
    let settings = await db.workspaceSettings.findUnique({
      where: { workspaceId: ctx.workspace.id },
    })

    if (!settings) {
      settings = await db.workspaceSettings.create({
        data: { workspaceId: ctx.workspace.id, ...data },
      })
    } else {
      await db.workspaceSettings.update({
        where: { workspaceId: ctx.workspace.id },
        data,
      })
    }

    return { ok: true }
  } catch (err) {
    console.error("[updateWorkspaceAppearance]", err)
    return { ok: false, error: "Failed to update appearance" }
  }
}

export async function getApiKeys() {
  const ctx = await getOrProvisionWorkspace()
  if (!ctx) return []

  return db.apiKey.findMany({
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
  })
}

export async function createApiKey(data: { name: string; expiresAt?: Date }) {
  const ctx = await getOrProvisionWorkspace()
  if (!ctx) return { ok: false, error: "Not authenticated" }

  try {
    const key = randomBytes(24).toString("hex")
    const keyPrefix = key.slice(0, 8)

    const apiKey = await db.apiKey.create({
      data: {
        name: data.name,
        keyPrefix,
        expiresAt: data.expiresAt,
        workspaceId: ctx.workspace.id,
      },
    })

    return { ok: true, key: apiKey.id + "." + key, keyPrefix }
  } catch (err) {
    console.error("[createApiKey]", err)
    return { ok: false, error: "Failed to create API key" }
  }
}

export async function deleteApiKey(id: string) {
  const ctx = await getOrProvisionWorkspace()
  if (!ctx) return { ok: false, error: "Not authenticated" }

  try {
    await db.apiKey.delete({
      where: { id, workspaceId: ctx.workspace.id },
    })

    return { ok: true }
  } catch (err) {
    console.error("[deleteApiKey]", err)
    return { ok: false, error: "Failed to delete API key" }
  }
}