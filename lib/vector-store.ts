import { toSql } from "pgvector"
import { db } from "@/lib/db"

// ─── Types ────────────────────────────────────────────────────────────────────

export type ChunkInput = {
  knowledgeSourceId: string
  content: string
  embedding: number[]
  chunkIndex: number
}

export type ChunkRow = {
  id: string
  content: string
  knowledgeSourceId: string
  chunkIndex: number
  createdAt: Date
}

export type SimilarChunk = ChunkRow & {
  // 0–1 where 1 is identical; cosine similarity = 1 − cosine_distance
  similarity: number
}

// ─── Store ────────────────────────────────────────────────────────────────────

/**
 * Persist a single text chunk and its embedding vector.
 */
export async function storeChunk(chunk: ChunkInput): Promise<void> {
  const { knowledgeSourceId, content, embedding, chunkIndex } = chunk
  const vec = toSql(embedding)

  await db.$executeRaw`
    INSERT INTO "DocumentChunk"
      (id, content, embedding, "chunkIndex", "knowledgeSourceId", "createdAt")
    VALUES
      (gen_random_uuid()::text, ${content}, ${vec}::vector, ${chunkIndex}, ${knowledgeSourceId}, now())
  `
}

/**
 * Persist multiple chunks in a single transaction.
 * Use this when processing a document — keeps the insert atomic and fast.
 */
export async function storeChunks(chunks: ChunkInput[]): Promise<void> {
  if (chunks.length === 0) return

  await db.$transaction(
    chunks.map(({ knowledgeSourceId, content, embedding, chunkIndex }) => {
      const vec = toSql(embedding)
      return db.$executeRaw`
        INSERT INTO "DocumentChunk"
          (id, content, embedding, "chunkIndex", "knowledgeSourceId", "createdAt")
        VALUES
          (gen_random_uuid()::text, ${content}, ${vec}::vector, ${chunkIndex}, ${knowledgeSourceId}, now())
      `
    })
  )
}

// ─── Search ───────────────────────────────────────────────────────────────────

/**
 * Find the most similar chunks to a query embedding using cosine similarity.
 *
 * @param queryEmbedding  1536-element vector from generateEmbedding()
 * @param limit           Max number of results (default 5)
 * @param knowledgeSourceId  Scope search to a single source (optional)
 * @param threshold       Minimum similarity 0–1 to include (default 0)
 */
export async function similaritySearch(
  queryEmbedding: number[],
  limit = 5,
  knowledgeSourceId?: string,
  threshold = 0
): Promise<SimilarChunk[]> {
  const vec = toSql(queryEmbedding)

  // Cosine distance operator <=> — lower is more similar.
  // Similarity = 1 - cosine_distance, so we can ORDER BY distance ASC.
  const rows = knowledgeSourceId
    ? await db.$queryRaw<SimilarChunk[]>`
        SELECT
          id,
          content,
          "knowledgeSourceId",
          "chunkIndex",
          "createdAt",
          (1 - (embedding <=> ${vec}::vector))::float AS similarity
        FROM "DocumentChunk"
        WHERE "knowledgeSourceId" = ${knowledgeSourceId}
          AND (1 - (embedding <=> ${vec}::vector)) >= ${threshold}
        ORDER BY embedding <=> ${vec}::vector
        LIMIT ${limit}
      `
    : await db.$queryRaw<SimilarChunk[]>`
        SELECT
          id,
          content,
          "knowledgeSourceId",
          "chunkIndex",
          "createdAt",
          (1 - (embedding <=> ${vec}::vector))::float AS similarity
        FROM "DocumentChunk"
        WHERE (1 - (embedding <=> ${vec}::vector)) >= ${threshold}
        ORDER BY embedding <=> ${vec}::vector
        LIMIT ${limit}
      `

  return rows
}

/**
 * Delete all chunks belonging to a knowledge source.
 * Called before re-processing a source to avoid stale embeddings.
 */
export async function deleteChunks(knowledgeSourceId: string): Promise<void> {
  await db.$executeRaw`
    DELETE FROM "DocumentChunk" WHERE "knowledgeSourceId" = ${knowledgeSourceId}
  `
}
