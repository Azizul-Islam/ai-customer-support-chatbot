"use client"

import { useState, useTransition } from "react"
import { Users, Plus, Trash2, Shield, UserCog, Mail, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Dialog } from "@/components/ui/dialog"
import {
  listMembers,
  inviteMember,
  removeMember,
  updateMemberRole,
} from "@/app/actions/members"
import type { MemberRow } from "@/app/actions/members"

function roleBadge(role: string) {
  const styles: Record<string, string> = {
    OWNER:
      "bg-purple-100 text-purple-700 border-purple-200",
    ADMIN:
      "bg-blue-100 text-blue-700 border-blue-200",
    MEMBER:
      "bg-gray-100 text-gray-700 border-gray-200",
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${styles[role] ?? styles.MEMBER}`}
    >
      {role === "OWNER" && <Shield className="size-3" />}
      {role === "ADMIN" && <UserCog className="size-3" />}
      {role}
    </span>
  )
}

export function MembersSettings({
  initialMembers,
  initialRole,
}: {
  initialMembers: MemberRow[]
  initialRole: string
}) {
  const isAdmin = initialRole === "OWNER" || initialRole === "ADMIN"
  const [members, setMembers] = useState<MemberRow[]>(initialMembers)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteName, setInviteName] = useState("")
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("MEMBER")
  const [inviting, startInvite] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const refresh = () => {
    startInvite(async () => {
      const result = await listMembers()
      if (result.members) setMembers(result.members)
    })
  }

  const handleInvite = () => {
    if (!inviteEmail.trim()) return
    setError(null)
    setSuccessMsg(null)
    startInvite(async () => {
      const result = await inviteMember(inviteEmail, inviteName || null, inviteRole)
      if (result.ok) {
        setInviteOpen(false)
        setInviteName("")
        setInviteEmail("")
        setInviteRole("MEMBER")
        setSuccessMsg(
          result.emailSent
            ? "Invitation sent! The member will receive an email."
            : "Member added successfully.",
        )
        refresh()
      } else {
        setError(result.error ?? "Failed to invite")
      }
    })
  }

  const handleRemove = (memberId: string) => {
    startInvite(async () => {
      const result = await removeMember(memberId)
      if (result.ok) refresh()
    })
  }

  const handleRoleChange = (memberId: string, newRole: string) => {
    startInvite(async () => {
      const result = await updateMemberRole(memberId, newRole)
      if (result.ok) refresh()
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Team Members</h2>
          <p className="text-sm text-muted-foreground">
            Manage who can access this workspace and reply to conversations
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => { setInviteOpen(true); setSuccessMsg(null) }} className="gap-1.5">
            <Plus className="size-4" />
            Invite
          </Button>
        )}
      </div>

      {successMsg && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
          {successMsg}
        </div>
      )}

      <div className="divide-y divide-border rounded-lg border border-border">
        {members.map((m) => (
          <div
            key={m.id}
            className="flex items-center justify-between gap-4 px-4 py-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">
                {(m.name ?? m.email)[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {m.name ?? "No name"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {m.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isAdmin && m.role !== "OWNER" ? (
                <Select
                  value={m.role}
                  onChange={(e) => handleRoleChange(m.id, e.target.value)}
                  className="w-28 text-xs"
                >
                  <option value="ADMIN">Admin</option>
                  <option value="MEMBER">Member</option>
                </Select>
              ) : (
                roleBadge(m.role)
              )}

              {isAdmin && m.role !== "OWNER" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(m.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>
          </div>
        ))}

        {members.length === 0 && (
          <div className="flex flex-col items-center py-8 text-center">
            <Users className="size-8 text-muted-foreground/30" />
            <p className="mt-2 text-sm text-muted-foreground">
              No team members yet.
            </p>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        <strong>Owner</strong> &amp; <strong>Admin</strong> can invite/remove
        members and manage settings. <strong>Members</strong> can view and reply
        to customer conversations.
      </p>

      <Dialog
        open={inviteOpen}
        onClose={() => {
          setInviteOpen(false)
          setError(null)
        }}
        title="Invite Team Member"
        description="Add a team member to this workspace. They can log in via ScaleKit SSO."
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-sm font-medium">
              <User className="size-3.5" />
              Name
            </label>
            <Input
              type="text"
              placeholder="John Doe"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-sm font-medium">
              <Mail className="size-3.5" />
              Email
            </label>
            <Input
              type="email"
              placeholder="colleague@company.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleInvite()
              }}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Role</label>
            <Select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
            >
              <option value="MEMBER">Member — Can reply to conversations</option>
              <option value="ADMIN">Admin — Can manage settings &amp; members</option>
            </Select>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setInviteOpen(false)
                setError(null)
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleInvite}
              disabled={!inviteEmail.trim() || inviting}
            >
              {inviting ? "Inviting..." : "Send Invite"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
