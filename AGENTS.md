<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Commands

```bash
npm run dev      # Start dev server at http://localhost:3000
npm run build   # Production build
npm run lint    # ESLint (flat config, ESLint 9)
npm run db:seed # Seed database
npm run db:studio # Prisma Studio
```

## Tech Stack

- **Next.js 16.2.4** with App Router, React 19.2.4
- **Prisma 6** with PostgreSQL + pgvector (embeddings)
- **Auth**: ScaleKit SDK (`@scalekit-sdk/node`)
- **AI**: OpenRouter by default (`meta-llama/llama-3.3-70b-instruct:free`)

## Database

- Prisma client is generated to `lib/generated/prisma` (not `node_modules`)
- Run `npx prisma generate` after schema changes
- Seed: `npm run db:seed`

## Architecture

- `app/` — Next.js App Router pages and API routes
- `app/actions/*.ts` — Server Actions (mutations)
- `app/api/*/route.ts` — Route handlers
- `lib/` — Shared utilities; `db.ts` imports from generated client

## Env Required

Create `.env` from `.env` template. Key vars:
- `DATABASE_URL` — PostgreSQL connection string
- `SCALEKIT_ENV_URL`, `SCALEKIT_CLIENT_ID`, `SCALEKIT_CLIENT_SECRET`
- `SESSION_SECRET` — `openssl rand -base64 32`
- `OPENAI_API_KEY` or `OPENROUTER_API_KEY`
- `ZENROWS_API_KEY` — Web scraping

## Style

- Tailwind CSS v4 (`@tailwindcss/postcss`)
- ESLint 9 flat config in `eslint.config.mjs`