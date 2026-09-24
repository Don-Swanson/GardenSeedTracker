-- AlterTable
ALTER TABLE "User" ADD COLUMN "onboardedAt" DATETIME;

-- Backfill: existing accounts have already completed whatever onboarding
-- existed at signup time. Only accounts created after this migration should
-- see the guided setup-profile step (e.g. new Google sign-ins).
UPDATE "User" SET "onboardedAt" = "createdAt" WHERE "onboardedAt" IS NULL;

-- Remove stale pending signups before enforcing uniqueness below - expired
-- rows are meant to be ephemeral and were never cleaned up proactively.
DELETE FROM "SignupData" WHERE "expiresAt" < CURRENT_TIMESTAMP;

-- CreateIndex
-- Reserves a username for the duration of a pending signup so two people
-- can't both claim the same one before either clicks their magic link.
CREATE UNIQUE INDEX "SignupData_username_key" ON "SignupData"("username");
