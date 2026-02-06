-- AlterTable
ALTER TABLE "chat_sessions" ADD COLUMN     "custom_title" TEXT,
ADD COLUMN     "is_pinned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pinned_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "chat_sessions_is_pinned_last_message_at_idx" ON "chat_sessions"("is_pinned", "last_message_at");
