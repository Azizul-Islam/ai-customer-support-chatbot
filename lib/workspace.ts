import "server-only"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

export type WorkspaceContext = {
  user: { id: string; email: string; name: string | null }
  workspace: { id: string; name: string; slug: string }
  role: string
}

export async function getOrProvisionWorkspace(): Promise<WorkspaceContext | null> {
  const session = await getSession()
  if (!session) return null

  const { userId: _unused, email, name } = session

  const user = await db.user.upsert({
    where: { email },
    update: { name: name ?? undefined },
    create: { email, name: name ?? null },
  })

  const membership = await db.workspaceMember.findFirst({
    where: { userId: user.id },
    include: { workspace: true },
    orderBy: { joinedAt: "asc" },
  })

  if (membership) {
    return {
      user: { id: user.id, email: user.email, name: user.name },
      workspace: { id: membership.workspace.id, name: membership.workspace.name, slug: membership.workspace.slug },
      role: membership.role,
    }
  }

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

  return {
    user: { id: user.id, email: user.email, name: user.name },
    workspace: { id: workspace.id, name: workspace.name, slug: workspace.slug },
    role: "OWNER",
  }
}
