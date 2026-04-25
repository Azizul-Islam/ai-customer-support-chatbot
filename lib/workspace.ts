import "server-only"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

export async function getOrProvisionWorkspace() {
  const session = await getSession()
  if (!session) return null

  const { userId: _unused, email, name } = session

  // Upsert user by email
  const user = await db.user.upsert({
    where: { email },
    update: { name: name ?? undefined },
    create: { email, name: name ?? null },
  })

  // Find existing workspace membership
  const membership = await db.workspaceMember.findFirst({
    where: { userId: user.id },
    include: { workspace: true },
    orderBy: { joinedAt: "asc" },
  })

  if (membership) {
    return { user, workspace: membership.workspace }
  }

  // Auto-provision first workspace for this user
  const slug = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "-")
  const workspace = await db.workspace.create({
    data: {
      name: name ? `${name}'s Workspace` : "My Workspace",
      slug: `${slug}-${Date.now()}`,
      members: {
        create: { userId: user.id, role: "OWNER" },
      },
    },
  })

  return { user, workspace }
}
