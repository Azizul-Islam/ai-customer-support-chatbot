"use server"

import { db } from "@/lib/db"
import { getOrProvisionWorkspace } from "@/lib/workspace"
import { scrapeUrl } from "@/app/actions/scrape"
import { generateEmbeddings } from "@/lib/embeddings"
import { storeChunks, deleteChunks } from "@/lib/vector-store"
import { chunkText } from "@/lib/text-chunker"

export type KnowledgeSourceResult =
  | { ok: true; sourceId: string; chunkCount: number }
  | { ok: false; error: string }

export type DeleteResult = { ok: true } | { ok: false; error: string }

async function processAndStore(
  knowledgeSourceId: string,
  text: string
): Promise<number> {
  const chunks = chunkText(text)
  if (chunks.length === 0) throw new Error("No text chunks extracted")

  const embeddings = await generateEmbeddings(chunks)

  await storeChunks(
    chunks.map((content, i) => ({
      knowledgeSourceId,
      content,
      embedding: embeddings[i],
      chunkIndex: i,
    }))
  )

  return chunks.length
}

export async function addWebSource(rawUrl: string): Promise<KnowledgeSourceResult> {
  const ctx = await getOrProvisionWorkspace()
  if (!ctx) return { ok: false, error: "Not authenticated" }

  // Validate URL before touching DB
  let url: string
  try {
    const parsed = new URL(rawUrl.trim())
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return { ok: false, error: "Only http and https URLs are supported" }
    }
    url = parsed.toString()
  } catch {
    return { ok: false, error: "Invalid URL" }
  }

  // Create source record immediately so UI can show PROCESSING state
  const source = await db.knowledgeSource.create({
    data: {
      name: url,
      type: "WEB",
      status: "PROCESSING",
      sourceUrl: url,
      workspaceId: ctx.workspace.id,
    },
  })

  try {
    const scraped = await scrapeUrl(url)
    if (!scraped.ok) {
      await db.knowledgeSource.update({
        where: { id: source.id },
        data: { status: "FAILED", meta: { error: scraped.error } },
      })
      return { ok: false, error: scraped.error }
    }

    const chunkCount = await processAndStore(source.id, scraped.text)

    // Use domain as a friendlier name
    const domain = new URL(url).hostname.replace(/^www\./, "")

    await db.knowledgeSource.update({
      where: { id: source.id },
      data: {
        name: domain,
        status: "READY",
        meta: { chunkCount, charCount: scraped.charCount, url: scraped.url },
      },
    })

    return { ok: true, sourceId: source.id, chunkCount }
  } catch (err) {
    await db.knowledgeSource.update({
      where: { id: source.id },
      data: {
        status: "FAILED",
        meta: { error: err instanceof Error ? err.message : "Unknown error" },
      },
    })
    return { ok: false, error: err instanceof Error ? err.message : "Processing failed" }
  }
}

export async function addTextSource(
  name: string,
  content: string
): Promise<KnowledgeSourceResult> {
  const ctx = await getOrProvisionWorkspace()
  if (!ctx) return { ok: false, error: "Not authenticated" }

  const trimmedName = name.trim()
  const trimmedContent = content.trim()

  if (!trimmedName) return { ok: false, error: "Name is required" }
  if (!trimmedContent) return { ok: false, error: "Content is required" }

  const source = await db.knowledgeSource.create({
    data: {
      name: trimmedName,
      type: "TEXT",
      status: "PROCESSING",
      content: trimmedContent,
      workspaceId: ctx.workspace.id,
    },
  })

  try {
    const chunkCount = await processAndStore(source.id, trimmedContent)

    await db.knowledgeSource.update({
      where: { id: source.id },
      data: {
        status: "READY",
        meta: { chunkCount, charCount: trimmedContent.length },
      },
    })

    return { ok: true, sourceId: source.id, chunkCount }
  } catch (err) {
    await db.knowledgeSource.update({
      where: { id: source.id },
      data: {
        status: "FAILED",
        meta: { error: err instanceof Error ? err.message : "Unknown error" },
      },
    })
    return { ok: false, error: err instanceof Error ? err.message : "Processing failed" }
  }
}

export async function deleteKnowledgeSource(id: string): Promise<DeleteResult> {
  const ctx = await getOrProvisionWorkspace()
  if (!ctx) return { ok: false, error: "Not authenticated" }

  const source = await db.knowledgeSource.findFirst({
    where: { id, workspaceId: ctx.workspace.id },
    select: { id: true },
  })
  if (!source) return { ok: false, error: "Source not found" }

  await deleteChunks(id)
  await db.knowledgeSource.delete({ where: { id } })

  return { ok: true }
}
