"use server"

import { db } from "@/lib/db"
import { getOrProvisionWorkspace } from "@/lib/workspace"
import { sendInviteEmail, canSendEmail } from "@/lib/mail"

export type MemberRow = {
  id: string
  userId: string
  email: string
  name: string | null
  role: string
  joinedAt: Date
}

function isAdmin(role: string): boolean {
  return role === "OWNER" || role === "ADMIN"
}

export async function listMembers(): Promise<{
  members?: MemberRow[]
  currentRole?: string
  error?: string
}> {
  const ctx = await getOrProvisionWorkspace()
  if (!ctx) return { error: "Not authenticated" }

  const members = await db.workspaceMember.findMany({
    where: { workspaceId: ctx.workspace.id },
    include: { user: { select: { email: true, name: true } } },
    orderBy: { joinedAt: "asc" },
  })

  return {
    currentRole: ctx.role,
    members: members.map((m) => ({
      id: m.id,
      userId: m.userId,
      email: m.user.email,
      name: m.user.name,
      role: m.role,
      joinedAt: m.joinedAt,
    })),
  }
}

export async function inviteMember(
  email: string,
  name: string | null,
  role: string = "MEMBER",
): Promise<{ ok: boolean; error?: string; emailSent?: boolean }> {
  const ctx = await getOrProvisionWorkspace()
  if (!ctx) return { ok: false, error: "Not authenticated" }
  if (!isAdmin(ctx.role))
    return { ok: false, error: "Only owners and admins can invite members" }
  if (!["OWNER", "ADMIN", "MEMBER"].includes(role))
    return { ok: false, error: "Invalid role" }

  const normalizedEmail = email.trim().toLowerCase()
  if (!normalizedEmail) return { ok: false, error: "Email is required" }
  const trimmedName = name?.trim() || null

  const user = await db.user.upsert({
    where: { email: normalizedEmail },
    update: { name: trimmedName ?? undefined },
    create: { email: normalizedEmail, name: trimmedName },
  })

  const existing = await db.workspaceMember.findFirst({
    where: { workspaceId: ctx.workspace.id, userId: user.id },
  })
  if (existing)
    return { ok: false, error: "This user is already a member" }

  await db.workspaceMember.create({
    data: {
      workspaceId: ctx.workspace.id,
      userId: user.id,
      role: role as "OWNER" | "ADMIN" | "MEMBER",
    },
  })

  let emailSent = false
  if (await canSendEmail()) {
    const result = await sendInviteEmail({
      to: normalizedEmail,
      toName: trimmedName ?? normalizedEmail,
      workspaceName: ctx.workspace.name,
      inviterName: ctx.user.name ?? ctx.user.email,
    })
    emailSent = result.ok
    if (!result.ok) {
      console.error("[inviteMember] email failed:", result.error)
    }
  }

  return { ok: true, emailSent }
}

export async function removeMember(
  memberId: string,
): Promise<{ ok: boolean; error?: string }> {
  const ctx = await getOrProvisionWorkspace()
  if (!ctx) return { ok: false, error: "Not authenticated" }
  if (!isAdmin(ctx.role))
    return { ok: false, error: "Only owners and admins can remove members" }

  const member = await db.workspaceMember.findFirst({
    where: { id: memberId, workspaceId: ctx.workspace.id },
  })
  if (!member) return { ok: false, error: "Member not found" }
  if (member.userId === ctx.user.id)
    return { ok: false, error: "You cannot remove yourself" }
  if (member.role === "OWNER")
    return { ok: false, error: "Cannot remove the workspace owner" }

  await db.workspaceMember.delete({ where: { id: memberId } })
  return { ok: true }
}

export async function updateMemberRole(
  memberId: string,
  newRole: string,
): Promise<{ ok: boolean; error?: string }> {
  const ctx = await getOrProvisionWorkspace()
  if (!ctx) return { ok: false, error: "Not authenticated" }
  if (!isAdmin(ctx.role))
    return { ok: false, error: "Only owners and admins can change roles" }
  if (!["ADMIN", "MEMBER"].includes(newRole))
    return { ok: false, error: "Invalid role" }

  const member = await db.workspaceMember.findFirst({
    where: { id: memberId, workspaceId: ctx.workspace.id },
  })
  if (!member) return { ok: false, error: "Member not found" }
  if (member.role === "OWNER")
    return { ok: false, error: "Cannot change the owner's role" }

  await db.workspaceMember.update({
    where: { id: memberId },
    data: { role: newRole as "ADMIN" | "MEMBER" },
  })
  return { ok: true }
}
