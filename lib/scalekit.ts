import { ScalekitClient } from "@scalekit-sdk/node"

const globalForScalekit = globalThis as unknown as {
  scalekit?: ScalekitClient
}

function createClient() {
  const envUrl = process.env.SCALEKIT_ENV_URL
  const clientId = process.env.SCALEKIT_CLIENT_ID
  const clientSecret = process.env.SCALEKIT_CLIENT_SECRET

  if (!envUrl || !clientId || !clientSecret) {
    throw new Error(
      "Missing required env vars: SCALEKIT_ENV_URL, SCALEKIT_CLIENT_ID, SCALEKIT_CLIENT_SECRET"
    )
  }

  return new ScalekitClient(envUrl, clientId, clientSecret)
}

export const scalekit =
  globalForScalekit.scalekit ?? createClient()

if (process.env.NODE_ENV !== "production") {
  globalForScalekit.scalekit = scalekit
}

export function getRedirectUri() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  return `${appUrl}/auth/callback`
}
