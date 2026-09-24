-- CreateTable
CREATE TABLE "SwapThread" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "listingId" TEXT NOT NULL,
    "initiatorId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "initiatorLastReadAt" DATETIME,
    "ownerLastReadAt" DATETIME,
    "lastNotifiedAt" DATETIME,
    "lastMessageAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SwapThread_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "SwapListing" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SwapThread_initiatorId_fkey" FOREIGN KEY ("initiatorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SwapThread_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SwapMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "threadId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SwapMessage_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "SwapThread" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SwapMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "swapMessageEmails" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_UserSettings" ("createdAt", "emailNotifications", "enableDirectSowReminders", "enableFallReminders", "enableIndoorStartReminders", "enableTransplantReminders", "enableWishlistReminders", "firstFrostDate", "hardinessZone", "id", "lastFrostDate", "latitude", "longitude", "plantingReminders", "reminderLeadDays", "timezone", "updatedAt", "userId", "zipCode") SELECT "createdAt", "emailNotifications", "enableDirectSowReminders", "enableFallReminders", "enableIndoorStartReminders", "enableTransplantReminders", "enableWishlistReminders", "firstFrostDate", "hardinessZone", "id", "lastFrostDate", "latitude", "longitude", "plantingReminders", "reminderLeadDays", "timezone", "updatedAt", "userId", "zipCode" FROM "UserSettings";
DROP TABLE "UserSettings";
ALTER TABLE "new_UserSettings" RENAME TO "UserSettings";
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "SwapThread_initiatorId_idx" ON "SwapThread"("initiatorId");

-- CreateIndex
CREATE INDEX "SwapThread_ownerId_idx" ON "SwapThread"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "SwapThread_listingId_initiatorId_key" ON "SwapThread"("listingId", "initiatorId");

-- CreateIndex
CREATE INDEX "SwapMessage_threadId_idx" ON "SwapMessage"("threadId");
