"use server"

import { ZenRows } from "zenrows"
import { parse } from "node-html-parser"

// Tags whose full subtree should be removed before text extraction —
// they contain navigation, ads, and code that is not meaningful content.
const NOISE_TAGS = [
  "script",
  "style",
  "noscript",
  "nav",
  "header",
  "footer",
  "aside",
  "figure",
  "figcaption",
  "iframe",
  "svg",
  "canvas",
  "form",
] as const

export type ScrapeResult =
  | { ok: true; text: string; url: string; charCount: number }
  | { ok: false; error: string; code?: number }

function extractText(html: string): string {
  const root = parse(html, { blockTextElements: { pre: true } })

  // Drop noise subtrees in-place
  for (const tag of NOISE_TAGS) {
    root.querySelectorAll(tag).forEach((el) => el.remove())
  }

  // Prefer semantic content containers; fall back to <body>
  const container =
    root.querySelector("main") ??
    root.querySelector("article") ??
    root.querySelector('[role="main"]') ??
    root.querySelector(".content, .post-content, .article-body, #content") ??
    root.querySelector("body") ??
    root

  // innerText gives us decoded text with whitespace from the DOM
  const raw = container.innerText

  // Collapse runs of whitespace / blank lines → single newline
  return raw
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n")
}

function getZenRowsClient(): ZenRows {
  const apiKey = process.env.ZENROWS_API_KEY
  if (!apiKey || apiKey === "your_zenrows_api_key") {
    throw new Error("ZENROWS_API_KEY is not configured")
  }
  // retries: 1 — one automatic retry on 429 / 5xx with exponential back-off
  return new ZenRows(apiKey, { retries: 1 })
}

export async function scrapeUrl(rawUrl: string): Promise<ScrapeResult> {
  // ── Validate URL ──────────────────────────────────────────────────────────
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

  // ── Fetch via ZenRows ────────────────────────────────────────────────────
  let response: Response
  try {
    const client = getZenRowsClient()
    response = await client.get(url, {
      // Pass through the real HTTP status from the target site so we can
      // detect 404/403/500 instead of always getting a 200 from ZenRows.
      original_status: true,
    })
  } catch (err) {
    // Network-level failures: DNS, connection refused, ZenRows timeout, etc.
    const message = err instanceof Error ? err.message : "Network error"
    return { ok: false, error: `Request failed: ${message}` }
  }

  // ── Handle non-2xx status codes ──────────────────────────────────────────
  if (!response.ok) {
    const codeMap: Record<number, string> = {
      400: "Bad request",
      401: "Unauthorized",
      403: "Access denied (403)",
      404: "Page not found (404)",
      408: "Request timed out (408)",
      429: "Rate limited — try again later (429)",
      500: "Target server error (500)",
      503: "Target server unavailable (503)",
    }
    const error =
      codeMap[response.status] ?? `HTTP ${response.status} from target`
    return { ok: false, error, code: response.status }
  }

  // ── Extract text ─────────────────────────────────────────────────────────
  let html: string
  try {
    html = await response.text()
  } catch {
    return { ok: false, error: "Failed to read response body" }
  }

  if (!html.trim()) {
    return { ok: false, error: "Target page returned empty content" }
  }

  const text = extractText(html)

  if (!text) {
    return {
      ok: false,
      error: "Could not extract readable text from the page",
    }
  }

  return { ok: true, text, url, charCount: text.length }
}
