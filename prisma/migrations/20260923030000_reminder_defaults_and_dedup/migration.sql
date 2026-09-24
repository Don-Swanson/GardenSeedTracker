-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PlantingReminderLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "plantNames" TEXT NOT NULL,
    "reminderType" TEXT NOT NULL,
    "targetDate" DATETIME NOT NULL,
    "plantKey" TEXT NOT NULL DEFAULT '',
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "year" INTEGER NOT NULL
);
INSERT INTO "new_PlantingReminderLog" ("id", "plantNames", "reminderType", "sentAt", "targetDate", "userId", "year") SELECT "id", "plantNames", "reminderType", "sentAt", "targetDate", "userId", "year" FROM "PlantingReminderLog";
DROP TABLE "PlantingReminderLog";
ALTER TABLE "new_PlantingReminderLog" RENAME TO "PlantingReminderLog";
CREATE INDEX "PlantingReminderLog_userId_idx" ON "PlantingReminderLog"("userId");
CREATE INDEX "PlantingReminderLog_userId_reminderType_year_idx" ON "PlantingReminderLog"("userId", "reminderType", "year");
CREATE TABLE "new_UserSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "zipCode" TEXT,
    "hardinessZone" TEXT,
    "lastFrostDate" DATETIME,
    "firstFrostDate" DATETIME,
    "latitude" REAL,
    "longitude" REAL,
    "timezone" TEXT,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "plantingReminders" BOOLEAN NOT NULL DEFAULT true,
    "enableIndoorStartReminders" BOOLEAN NOT NULL DEFAULT true,
    "enableDirectSowReminders" BOOLEAN NOT NULL DEFAULT true,
    "enableTransplantReminders" BOOLEAN NOT NULL DEFAULT true,
    "enableFallReminders" BOOLEAN NOT NULL DEFAULT true,
    "enableWishlistReminders" BOOLEAN NOT NULL DEFAULT false,
    "reminderLeadDays" INTEGER NOT NULL DEFAULT 7,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
-- The three reminder columns switch from default-off to default-on. For
-- *existing* rows we only flip them to true when the account never touched
-- any of the three (all still false, and the row was never updated after
-- creation) - anyone who explicitly turned reminders off, or explicitly
-- customized them, keeps their own choice untouched.
INSERT INTO "new_UserSettings" ("createdAt", "emailNotifications", "enableDirectSowReminders", "enableIndoorStartReminders", "enableTransplantReminders", "firstFrostDate", "hardinessZone", "id", "lastFrostDate", "latitude", "longitude", "plantingReminders", "reminderLeadDays", "timezone", "updatedAt", "userId", "zipCode")
SELECT
    "createdAt", "emailNotifications",
    CASE WHEN "enableIndoorStartReminders" = 0 AND "enableDirectSowReminders" = 0 AND "enableTransplantReminders" = 0 AND "updatedAt" = "createdAt"
         THEN 1 ELSE "enableDirectSowReminders" END,
    CASE WHEN "enableIndoorStartReminders" = 0 AND "enableDirectSowReminders" = 0 AND "enableTransplantReminders" = 0 AND "updatedAt" = "createdAt"
         THEN 1 ELSE "enableIndoorStartReminders" END,
    CASE WHEN "enableIndoorStartReminders" = 0 AND "enableDirectSowReminders" = 0 AND "enableTransplantReminders" = 0 AND "updatedAt" = "createdAt"
         THEN 1 ELSE "enableTransplantReminders" END,
    "firstFrostDate", "hardinessZone", "id", "lastFrostDate", "latitude", "longitude", "plantingReminders", "reminderLeadDays", "timezone", "updatedAt", "userId", "zipCode"
FROM "UserSettings";
DROP TABLE "UserSettings";
ALTER TABLE "new_UserSettings" RENAME TO "UserSettings";
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
