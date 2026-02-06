-- AlterTable
ALTER TABLE "chat_messages" ADD COLUMN     "parent_message_id" TEXT;

-- CreateIndex
CREATE INDEX "chat_messages_parent_message_id_idx" ON "chat_messages"("parent_message_id");
