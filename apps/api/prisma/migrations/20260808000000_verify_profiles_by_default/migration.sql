-- AlterTable
ALTER TABLE "profiles" ALTER COLUMN "isVerified" SET DEFAULT true;

-- Backfill: no admin UI exists to verify profiles, so every existing row is
-- promoted. Inactive profiles are included too — "isActive" is the separate
-- flag that hides them, and search filters on it independently.
UPDATE "profiles" SET "isVerified" = true WHERE "isVerified" = false;
