import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { getOrProvisionWorkspace } from "@/lib/workspace"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const ctx = await getOrProvisionWorkspace()
  const role = ctx?.role ?? "MEMBER"

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar role={role} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
