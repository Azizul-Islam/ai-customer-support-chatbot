import { ConversationsManager } from "@/components/conversations-manager"
import { getSessions } from "@/app/actions/conversations"

export default async function ConversationsPage() {
  const sessions = await getSessions("ALL")
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <ConversationsManager initialSessions={sessions} />
    </div>
  )
}
