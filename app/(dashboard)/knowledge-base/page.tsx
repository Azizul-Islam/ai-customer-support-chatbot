import { BookOpen, Upload, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function KnowledgeBasePage() {
  return (
    <div className="flex flex-col gap-8 p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="size-6 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Knowledge Base
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage documents and data sources for your chatbots
            </p>
          </div>
        </div>
        <Button className="gap-2">
          <Upload className="size-4" />
          Upload Document
        </Button>
      </div>

      <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center">
        <FileText className="mx-auto size-12 text-muted-foreground/40" />
        <h2 className="mt-4 text-lg font-medium">No documents uploaded</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload PDFs, text files, or web pages to train your chatbots.
        </p>
        <Button variant="outline" className="mt-6 gap-2">
          <Upload className="size-4" />
          Upload your first document
        </Button>
      </div>
    </div>
  )
}
