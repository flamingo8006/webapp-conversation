-- CreateTable
CREATE TABLE "chatbot_apps" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "dify_app_id" TEXT NOT NULL,
    "api_key_encrypted" TEXT NOT NULL,
    "api_url" TEXT NOT NULL DEFAULT 'https://api.dify.ai/v1',
    "icon_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" TEXT,

    CONSTRAINT "chatbot_apps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "user_login_id" TEXT NOT NULL,
    "user_name" TEXT,
    "app_id" TEXT NOT NULL,
    "dify_conversation_id" TEXT,
    "title" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_message_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "dify_message_id" TEXT,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "files" JSONB,
    "feedback" TEXT,
    "token_count" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "chat_sessions_user_id_app_id_idx" ON "chat_sessions"("user_id", "app_id");

-- CreateIndex
CREATE INDEX "chat_sessions_dify_conversation_id_idx" ON "chat_sessions"("dify_conversation_id");

-- CreateIndex
CREATE INDEX "chat_messages_session_id_idx" ON "chat_messages"("session_id");

-- CreateIndex
CREATE INDEX "chat_messages_dify_message_id_idx" ON "chat_messages"("dify_message_id");

-- AddForeignKey
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_app_id_fkey" FOREIGN KEY ("app_id") REFERENCES "chatbot_apps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "chat_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
