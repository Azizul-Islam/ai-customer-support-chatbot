-- CreateEnum
CREATE TYPE "AiProvider" AS ENUM ('OPENAI', 'ANTHROPIC', 'OPENROUTER');

-- AlterTable
ALTER TABLE "WorkspaceSettings" ADD COLUMN     "aiApiKey" TEXT,
ADD COLUMN     "aiModel" TEXT DEFAULT 'meta-llama/llama-3.3-70b-instruct:free',
ADD COLUMN     "aiProvider" "AiProvider" NOT NULL DEFAULT 'OPENROUTER';
