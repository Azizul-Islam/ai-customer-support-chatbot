import { redirect } from "next/navigation"
import { getOrProvisionWorkspace } from "@/lib/workspace"
import { db } from "@/lib/db"
import { KnowledgeBaseManager } from "@/components/knowledge-base-manager"
import type { KnowledgeSourceRow } from "@/components/knowledge-base-manager"

export default async function KnowledgeBasePage() {
  const ctx = await getOrProvisionWorkspace()
  if (!ctx) redirect("/login")
  if (ctx.role === "MEMBER") redirect("/conversations")

  const sources: KnowledgeSourceRow[] = ctx
    ? (
        await db.knowledgeSource.findMany({
          where: { workspaceId: ctx.workspace.id },
          orderBy: { createdAt: "desc" },
          include: { _count: { select: { chunks: true } } },
        })
      ).map((s) => ({
        id: s.id,
        name: s.name,
        type: s.type,
        status: s.status,
        sourceUrl: s.sourceUrl,
        createdAt: s.createdAt,
        chunkCount: s._count.chunks,
      }))
    : []

  return <KnowledgeBaseManager initialSources={sources} />
}
