-- AlterTable
ALTER TABLE "admins" ADD COLUMN     "locked_until" TIMESTAMP(3),
ADD COLUMN     "login_attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "previous_password_hash" TEXT;
