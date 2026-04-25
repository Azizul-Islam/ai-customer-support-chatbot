"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  Globe,
  FileText,
  File,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Zap,
  BookOpen,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import {
  addWebSource,
  addTextSource,
  deleteKnowledgeSource,
} from "@/app/actions/knowledge-source"

// ─── Types ────────────────────────────────────────────────────────────────────

type SourceType = "WEB" | "TEXT" | "FILE"
type SourceStatus = "PENDING" | "PROCESSING" | "READY" | "FAILED"

export interface KnowledgeSourceRow {
  id: string
  name: string
  type: SourceType
  status: SourceStatus
  sourceUrl: string | null
  createdAt: Date
  chunkCount: number
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: SourceStatus }) {
  const map: Record<SourceStatus, { label: string; icon: React.ReactNode; className: string }> = {
    READY: {
      label: "Ready",
      icon: <CheckCircle2 className="size-3" />,
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    PROCESSING: {
      label: "Processing",
      icon: <Loader2 className="size-3 animate-spin" />,
      className: "bg-yellow-50 text-yellow-700 border-yellow-200",
    },
    PENDING: {
      label: "Pending",
      icon: <Clock className="size-3" />,
      className: "bg-muted text-muted-foreground border-border",
    },
    FAILED: {
      label: "Failed",
      icon: <AlertCircle className="size-3" />,
      className: "bg-red-50 text-red-700 border-red-200",
    },
  }
  const { label, icon, className } = map[status]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        className
      )}
    >
      {icon}
      {label}
    </span>
  )
}

// ─── Type icon ────────────────────────────────────────────────────────────────

function TypeIcon({ type }: { type: SourceType }) {
  const icons: Record<SourceType, React.ReactNode> = {
    WEB: <Globe className="size-4" />,
    TEXT: <FileText className="size-4" />,
    FILE: <File className="size-4" />,
  }
  return (
    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
      {icons[type]}
    </div>
  )
}

// ─── Tab button ───────────────────────────────────────────────────────────────

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  )
}

// ─── Add Source Dialog ────────────────────────────────────────────────────────

function AddSourceDialog({
  open,
  onClose,
  onAdded,
}: {
  open: boolean
  onClose: () => void
  onAdded: () => void
}) {
  const [tab, setTab] = useState<"url" | "text" | "file">("url")
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // URL tab
  const [url, setUrl] = useState("")

  // Text tab
  const [textName, setTextName] = useState("")
  const [textContent, setTextContent] = useState("")

  // File tab
  const [fileName, setFileName] = useState("")
  const [fileContent, setFileContent] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setError(null)
    setUrl("")
    setTextName("")
    setTextContent("")
    setFileName("")
    setFileContent("")
    if (fileRef.current) fileRef.current.value = ""
  }

  const handleClose = () => {
    if (isPending) return
    reset()
    onClose()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name.replace(/\.[^.]+$/, ""))
    const reader = new FileReader()
    reader.onload = (ev) => setFileContent((ev.target?.result as string) ?? "")
    reader.readAsText(file)
  }

  const submit = () => {
    setError(null)
    startTransition(async () => {
      let result

      if (tab === "url") {
        result = await addWebSource(url)
      } else if (tab === "text") {
        result = await addTextSource(textName, textContent)
      } else {
        result = await addTextSource(fileName || "Uploaded file", fileContent)
      }

      if (!result.ok) {
        setError(result.error)
        return
      }

      reset()
      onAdded()
      onClose()
    })
  }

  const canSubmit =
    !isPending &&
    (tab === "url"
      ? url.trim().length > 0
      : tab === "text"
        ? textName.trim().length > 0 && textContent.trim().length > 0
        : fileContent.length > 0)

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Add Knowledge Source"
      description="Embed a web page, paste text, or upload a file to train your chatbots."
    >
      {/* Tab switcher */}
      <div className="mb-5 flex rounded-lg bg-muted p-1">
        <TabButton active={tab === "url"} onClick={() => setTab("url")}>
          <Globe className="mr-1.5 inline size-3.5" />
          URL
        </TabButton>
        <TabButton active={tab === "text"} onClick={() => setTab("text")}>
          <FileText className="mr-1.5 inline size-3.5" />
          Text
        </TabButton>
        <TabButton active={tab === "file"} onClick={() => setTab("file")}>
          <File className="mr-1.5 inline size-3.5" />
          File
        </TabButton>
      </div>

      {/* URL tab */}
      {tab === "url" && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ks-url">Web URL</Label>
            <Input
              id="ks-url"
              type="url"
              placeholder="https://example.com/docs"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">
              Page will be scraped and chunked into embeddings automatically.
            </p>
          </div>
        </div>
      )}

      {/* Text tab */}
      {tab === "text" && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ks-name">Source Name</Label>
            <Input
              id="ks-name"
              placeholder="Company FAQ"
              value={textName}
              onChange={(e) => setTextName(e.target.value)}
              disabled={isPending}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ks-content">Content</Label>
            <Textarea
              id="ks-content"
              placeholder="Paste your text content here…"
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              className="min-h-36 resize-y"
              disabled={isPending}
            />
          </div>
        </div>
      )}

      {/* File tab */}
      {tab === "file" && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ks-file">File (.txt or .md)</Label>
            <input
              ref={fileRef}
              id="ks-file"
              type="file"
              accept=".txt,.md,.markdown"
              onChange={handleFileChange}
              disabled={isPending}
              className="block w-full cursor-pointer text-sm text-muted-foreground file:mr-3 file:cursor-pointer file:rounded-md file:border file:border-input file:bg-background file:px-3 file:py-1 file:text-xs file:font-medium file:text-foreground hover:file:bg-muted"
            />
          </div>
          {fileContent && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ks-file-name">Source Name</Label>
              <Input
                id="ks-file-name"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                disabled={isPending}
              />
              <p className="text-xs text-muted-foreground">
                {fileContent.length.toLocaleString()} characters read.
              </p>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="mt-5 flex justify-end gap-2">
        <Button variant="outline" onClick={handleClose} disabled={isPending}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={!canSubmit} className="gap-2">
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Processing…
            </>
          ) : (
            <>
              <Zap className="size-4" />
              Add &amp; Embed
            </>
          )}
        </Button>
      </div>
    </Dialog>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function KnowledgeBaseManager({
  initialSources,
}: {
  initialSources: KnowledgeSourceRow[]
}) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleAdded = () => router.refresh()

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"? This will remove all its embeddings.`)) return
    setDeletingId(id)
    await deleteKnowledgeSource(id)
    setDeletingId(null)
    router.refresh()
  }

  return (
    <>
      <div className="flex flex-col gap-8 p-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="size-6 text-muted-foreground" />
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Knowledge Base</h1>
              <p className="text-sm text-muted-foreground">
                Manage documents and data sources for your chatbots
              </p>
            </div>
          </div>
          <Button className="gap-2" onClick={() => setDialogOpen(true)}>
            <Plus className="size-4" />
            Add Source
          </Button>
        </div>

        {/* Empty state */}
        {initialSources.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center">
            <FileText className="mx-auto size-12 text-muted-foreground/40" />
            <h2 className="mt-4 text-lg font-medium">No sources added</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Add a URL, paste text, or upload a file to train your chatbots.
            </p>
            <Button className="mt-6 gap-2" onClick={() => setDialogOpen(true)}>
              <Plus className="size-4" />
              Add your first source
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {initialSources.map((source) => (
              <Card key={source.id}>
                <CardContent className="flex items-center gap-4 p-4">
                  <TypeIcon type={source.type} />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium">{source.name}</p>
                      <StatusBadge status={source.status} />
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="rounded bg-muted px-1.5 py-0.5 font-mono uppercase">
                        {source.type}
                      </span>
                      {source.chunkCount > 0 && (
                        <span>{source.chunkCount} chunk{source.chunkCount !== 1 ? "s" : ""}</span>
                      )}
                      {source.sourceUrl && (
                        <span className="truncate max-w-[200px]">{source.sourceUrl}</span>
                      )}
                      <span>
                        {new Date(source.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    disabled={deletingId === source.id}
                    onClick={() => handleDelete(source.id, source.name)}
                  >
                    {deletingId === source.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Trash2 className="size-4" />
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AddSourceDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onAdded={handleAdded}
      />
    </>
  )
}
