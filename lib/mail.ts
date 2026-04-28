import "server-only"

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"

function getBrevoApiKey(): string | null {
  return process.env.BREVO_API_KEY ?? null
}

function getBrevoSender(): { name: string; email: string } {
  return {
    name: process.env.BREVO_SENDER_NAME ?? "SupportIQ",
    email: process.env.BREVO_SENDER_EMAIL ?? "noreply@example.com",
  }
}

export async function canSendEmail(): Promise<boolean> {
  return !!getBrevoApiKey()
}

export async function sendEmail({
  to,
  toName,
  subject,
  htmlContent,
}: {
  to: string
  toName?: string
  subject: string
  htmlContent: string
}): Promise<{ ok: boolean; error?: string }> {
  const apiKey = getBrevoApiKey()
  if (!apiKey) return { ok: false, error: "Brevo API key not configured" }

  const sender = getBrevoSender()

  try {
    const res = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender,
        to: [{ email: to, name: toName ?? to }],
        subject,
        htmlContent,
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      console.error("[Brevo] send failed:", res.status, body)
      return { ok: false, error: `Brevo API error: ${res.status}` }
    }

    return { ok: true }
  } catch (err) {
    console.error("[Brevo] send error:", err)
    return { ok: false, error: "Failed to send email" }
  }
}

export async function sendInviteEmail({
  to,
  toName,
  workspaceName,
  inviterName,
}: {
  to: string
  toName: string
  workspaceName: string
  inviterName: string
}): Promise<{ ok: boolean; error?: string }> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

  const htmlContent = `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px">
      <h2 style="color:#1e293b;margin:0 0 8px">You've been invited to join ${workspaceName}</h2>
      <p style="color:#475569;font-size:15px;margin:0 0 16px">
        Hi ${toName},<br/><br/>
        ${inviterName} has invited you to join the <strong>${workspaceName}</strong> workspace on SupportIQ.
        As a team member, you'll be able to view and reply to customer conversations.
      </p>
      <a href="${appUrl}/login"
         style="display:inline-block;background:#6366f1;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600">
        Accept Invitation &amp; Sign In
      </a>
      <p style="color:#94a3b8;font-size:12px;margin:20px 0 0">
        If you already have an account, simply sign in with your SSO credentials.
        If you did not expect this invitation, you can safely ignore this email.
      </p>
    </div>
  `

  return sendEmail({
    to,
    toName,
    subject: `You've been invited to join ${workspaceName} on SupportIQ`,
    htmlContent,
  })
}
