-- AlterTable
ALTER TABLE "admins" ADD COLUMN     "group_id" TEXT,
ADD COLUMN     "group_role" TEXT NOT NULL DEFAULT 'member';

-- AlterTable
ALTER TABLE "chatbot_apps" ADD COLUMN     "group_id" TEXT;

-- CreateTable
CREATE TABLE "admin_groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "admin_groups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_groups_name_key" ON "admin_groups"("name");

-- CreateIndex
CREATE INDEX "admin_groups_name_idx" ON "admin_groups"("name");

-- CreateIndex
CREATE INDEX "admins_group_id_idx" ON "admins"("group_id");

-- CreateIndex
CREATE INDEX "chatbot_apps_group_id_idx" ON "chatbot_apps"("group_id");

-- AddForeignKey
ALTER TABLE "chatbot_apps" ADD CONSTRAINT "chatbot_apps_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "admin_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admins" ADD CONSTRAINT "admins_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "admin_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
