-- Admin & moderator portal: roles, permissions, verification workflow,
-- staff attribution and sample profiles.

-- SUPER_ADMIN is appended to the existing type. Nothing in this migration may
-- reference it: Postgres forbids using a new enum value in the transaction that
-- adds it, which is why the permission seed is a separate migration.
ALTER TYPE "Role" ADD VALUE 'SUPER_ADMIN';

CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED');

-- Sample profiles have no Supabase auth user. The unique index survives:
-- Postgres treats NULLs as distinct, so any number of them may coexist.
ALTER TABLE "profiles" ALTER COLUMN "supabaseId" DROP NOT NULL;

ALTER TABLE "profiles"
  ADD COLUMN "isDummy" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'VERIFIED',
  ADD COLUMN "rejectionReason" TEXT,
  ADD COLUMN "verifiedAt" TIMESTAMP(3),
  ADD COLUMN "verifiedById" TEXT,
  ADD COLUMN "createdById" TEXT,
  ADD COLUMN "updatedById" TEXT;

-- Existing rows were all verified by 20260808000000_verify_profiles_by_default,
-- so the new column already matches reality. Stated explicitly rather than
-- assumed, in case a row was un-verified by hand since then.
UPDATE "profiles" SET "verificationStatus" = 'REJECTED' WHERE "isVerified" = false;

CREATE INDEX "profiles_role_idx" ON "profiles"("role");
CREATE INDEX "profiles_verificationStatus_idx" ON "profiles"("verificationStatus");
CREATE INDEX "profiles_createdAt_idx" ON "profiles"("createdAt");
CREATE INDEX "profiles_createdById_idx" ON "profiles"("createdById");

CREATE TABLE "role_permissions" (
    "id" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "permission" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "role_permissions_role_permission_key" ON "role_permissions"("role", "permission");

CREATE TABLE "admin_audit_logs" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetId" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "admin_audit_logs_actorId_createdAt_idx" ON "admin_audit_logs"("actorId", "createdAt");
CREATE INDEX "admin_audit_logs_action_createdAt_idx" ON "admin_audit_logs"("action", "createdAt");
