import { Bot, Plus, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ChatbotsPage() {
  return (
    <div className="flex flex-col gap-8 p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bot className="size-6 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Chatbots</h1>
            <p className="text-sm text-muted-foreground">
              Build and manage your AI chatbot assistants
            </p>
          </div>
        </div>
        <Button className="gap-2">
          <Plus className="size-4" />
          New Chatbot
        </Button>
      </div>

      <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center">
        <Zap className="mx-auto size-12 text-muted-foreground/40" />
        <h2 className="mt-4 text-lg font-medium">No chatbots created</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Create an AI chatbot, connect a knowledge base, and embed it anywhere.
        </p>
        <Button className="mt-6 gap-2">
          <Plus className="size-4" />
          Create your first chatbot
        </Button>
      </div>
    </div>
  )
}
