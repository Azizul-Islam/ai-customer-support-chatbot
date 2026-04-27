import OpenAI from "openai"

// text-embedding-3-small: 1536 dimensions, fast, cost-effective
const EMBEDDING_MODEL = "text-embedding-3-small"
export const EMBEDDING_DIMENSIONS = 1536

// Singleton — reuses the same HTTP client across requests in dev hot-reload
const globalForOpenAI = globalThis as unknown as { openai?: OpenAI }

// Embeddings require a real OpenAI key (EMBED_API_KEY) or a plain OpenAI key.
// OpenRouter keys (sk-or-v1-*) cannot call text-embedding-3-small.
// If only an OpenRouter key is available, generateEmbedding throws and the
// caller's non-fatal catch block skips RAG context — chat still works.
function getClient(): OpenAI {
  const embedKey = process.env.EMBED_API_KEY ?? process.env.OPENAI_API_KEY ?? ""
  const isOpenRouterKey = embedKey.startsWith("sk-or-v1-")

  if (isOpenRouterKey) {
    throw new Error(
      "Embeddings require an OpenAI API key. Set EMBED_API_KEY in .env with a real OpenAI key, " +
        "or add knowledge-base support by upgrading your plan."
    )
  }

  if (!globalForOpenAI.openai) {
    globalForOpenAI.openai = new OpenAI({ apiKey: embedKey })
  }
  return globalForOpenAI.openai
}

// Collapse newlines — OpenAI recommends this for embedding quality
function normalizeText(text: string): string {
  return text.replace(/\n+/g, " ").trim()
}

/**
 * Generate a single embedding vector for one piece of text.
 * Returns a 1536-element number array.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await getClient().embeddings.create({
    model: EMBEDDING_MODEL,
    input: normalizeText(text),
    dimensions: EMBEDDING_DIMENSIONS,
  })
  return response.data[0].embedding
}

/**
 * Generate embeddings for multiple texts in a single API call.
 * OpenAI batches them server-side — cheaper and faster than N serial calls.
 * Returns arrays in the same order as the input.
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return []

  const response = await getClient().embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts.map(normalizeText),
    dimensions: EMBEDDING_DIMENSIONS,
  })

  // API guarantees ordering by index but we sort defensively
  return response.data
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding)
}
