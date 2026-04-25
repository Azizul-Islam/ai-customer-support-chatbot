const MAX_CHUNK = 800
const MIN_CHUNK = 20

export function chunkText(text: string): string[] {
  const paragraphs = text.split(/\n{2,}/).map((s) => s.trim()).filter(Boolean)
  const chunks: string[] = []
  let current = ""

  for (const para of paragraphs) {
    if (!current) {
      current = para
    } else if (current.length + para.length + 2 <= MAX_CHUNK) {
      current += "\n\n" + para
    } else {
      chunks.push(current)
      current = para
    }

    // Single paragraph too long — split at sentence boundaries
    while (current.length > MAX_CHUNK) {
      const cut = current.lastIndexOf(". ", MAX_CHUNK)
      if (cut > 100) {
        chunks.push(current.slice(0, cut + 1))
        current = current.slice(cut + 2)
      } else {
        chunks.push(current.slice(0, MAX_CHUNK))
        current = current.slice(MAX_CHUNK)
      }
    }
  }

  if (current.trim()) chunks.push(current.trim())

  return chunks.filter((c) => c.length >= MIN_CHUNK)
}
