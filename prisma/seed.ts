import { PrismaClient } from "../lib/generated/prisma/client"

const db = new PrismaClient()

async function main() {
  // Workspace (tenant)
  const workspace = await db.workspace.upsert({
    where: { slug: "demo-workspace" },
    update: {},
    create: {
      name: "Demo Workspace",
      slug: "demo-workspace",
    },
  })
  console.log(`Workspace: ${workspace.id} (${workspace.slug})`)

  // User
  const user = await db.user.upsert({
    where: { email: "admin@demo.com" },
    update: {},
    create: {
      email: "admin@demo.com",
      name: "Demo Admin",
      memberships: {
        create: {
          workspaceId: workspace.id,
          role: "OWNER",
        },
      },
    },
  })
  console.log(`User: ${user.id} (${user.email})`)

  // Chatbot with config
  const chatbot = await db.chatbot.upsert({
    where: { id: "seed-chatbot-01" },
    update: {},
    create: {
      id: "seed-chatbot-01",
      name: "Support Bot",
      status: "ACTIVE",
      systemPrompt:
        "You are a helpful support assistant. Answer questions clearly and concisely.",
      welcomeMessage: "Hi! How can I help you today?",
      config: {
        primaryColor: "#6366f1",
        backgroundColor: "#ffffff",
        fontFamily: "Inter, sans-serif",
        avatarUrl: null,
        temperature: 0.7,
        maxTokens: 1024,
      },
      workspaceId: workspace.id,
    },
  })
  console.log(`Chatbot: ${chatbot.id} (${chatbot.name})`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
