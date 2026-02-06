-- CreateTable
CREATE TABLE "admins" (
    "id" TEXT NOT NULL,
    "login_id" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "department" TEXT,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "last_login_ip" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actor_type" TEXT NOT NULL,
    "actor_id" TEXT,
    "actor_login_id" TEXT NOT NULL,
    "actor_name" TEXT NOT NULL,
    "actor_role" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "changes" JSONB,
    "metadata" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "request_path" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "error_logs" (
    "id" TEXT NOT NULL,
    "error_type" TEXT NOT NULL,
    "error_code" TEXT,
    "message" TEXT NOT NULL,
    "stack_trace" TEXT,
    "source" TEXT NOT NULL,
    "request_path" TEXT,
    "request_method" TEXT,
    "user_emp_no" TEXT,
    "admin_id" TEXT,
    "session_id" TEXT,
    "app_id" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "resolved_at" TIMESTAMP(3),
    "resolved_by" TEXT,
    "resolution" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "error_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_usage_stats" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "app_id" TEXT,
    "total_sessions" INTEGER NOT NULL DEFAULT 0,
    "new_sessions" INTEGER NOT NULL DEFAULT 0,
    "auth_sessions" INTEGER NOT NULL DEFAULT 0,
    "anonymous_sessions" INTEGER NOT NULL DEFAULT 0,
    "total_messages" INTEGER NOT NULL DEFAULT 0,
    "user_messages" INTEGER NOT NULL DEFAULT 0,
    "assistant_messages" INTEGER NOT NULL DEFAULT 0,
    "unique_users" INTEGER NOT NULL DEFAULT 0,
    "total_tokens" INTEGER NOT NULL DEFAULT 0,
    "like_feedbacks" INTEGER NOT NULL DEFAULT 0,
    "dislike_feedbacks" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_usage_stats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admins_login_id_key" ON "admins"("login_id");

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");

-- CreateIndex
CREATE INDEX "admins_login_id_idx" ON "admins"("login_id");

-- CreateIndex
CREATE INDEX "admins_role_idx" ON "admins"("role");

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_idx" ON "audit_logs"("actor_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "error_logs_error_type_idx" ON "error_logs"("error_type");

-- CreateIndex
CREATE INDEX "error_logs_status_idx" ON "error_logs"("status");

-- CreateIndex
CREATE INDEX "error_logs_app_id_idx" ON "error_logs"("app_id");

-- CreateIndex
CREATE INDEX "error_logs_created_at_idx" ON "error_logs"("created_at");

-- CreateIndex
CREATE INDEX "daily_usage_stats_date_idx" ON "daily_usage_stats"("date");

-- CreateIndex
CREATE INDEX "daily_usage_stats_app_id_idx" ON "daily_usage_stats"("app_id");

-- CreateIndex
CREATE UNIQUE INDEX "daily_usage_stats_date_app_id_key" ON "daily_usage_stats"("date", "app_id");

-- AddForeignKey
ALTER TABLE "daily_usage_stats" ADD CONSTRAINT "daily_usage_stats_app_id_fkey" FOREIGN KEY ("app_id") REFERENCES "chatbot_apps"("id") ON DELETE SET NULL ON UPDATE CASCADE;
