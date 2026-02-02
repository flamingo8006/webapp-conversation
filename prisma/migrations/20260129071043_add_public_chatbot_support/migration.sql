-- AlterTable
ALTER TABLE "chat_sessions" ADD COLUMN     "is_anonymous" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "session_id" TEXT,
ALTER COLUMN "user_id" DROP NOT NULL,
ALTER COLUMN "user_login_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "chatbot_apps" ADD COLUMN     "allow_anonymous" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_public" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "max_anonymous_msgs" INTEGER,
ADD COLUMN     "require_auth" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "chat_sessions_session_id_app_id_idx" ON "chat_sessions"("session_id", "app_id");
