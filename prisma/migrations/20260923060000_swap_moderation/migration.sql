-- CreateTable
CREATE TABLE "SwapReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reporterId" TEXT NOT NULL,
    "listingId" TEXT,
    "messageId" TEXT,
    "reportedUserId" TEXT,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "adminNotes" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SwapReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SwapReport_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "SwapListing" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SwapReport_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "SwapMessage" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SwapReport_reportedUserId_fkey" FOREIGN KEY ("reportedUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserBlock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "blockerId" TEXT NOT NULL,
    "blockedId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserBlock_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserBlock_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AdminNotificationSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "adminEmail" TEXT NOT NULL,
    "newUserSignup" BOOLEAN NOT NULL DEFAULT true,
    "userDeleted" BOOLEAN NOT NULL DEFAULT false,
    "newPlantSubmission" BOOLEAN NOT NULL DEFAULT true,
    "newPlantSuggestion" BOOLEAN NOT NULL DEFAULT true,
    "newPlantRequest" BOOLEAN NOT NULL DEFAULT true,
    "newSwapReport" BOOLEAN NOT NULL DEFAULT true,
    "dailyDigest" BOOLEAN NOT NULL DEFAULT false,
    "weeklyDigest" BOOLEAN NOT NULL DEFAULT true,
    "errorAlerts" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_AdminNotificationSettings" ("adminEmail", "createdAt", "dailyDigest", "errorAlerts", "id", "newPlantRequest", "newPlantSubmission", "newPlantSuggestion", "newUserSignup", "updatedAt", "userDeleted", "weeklyDigest") SELECT "adminEmail", "createdAt", "dailyDigest", "errorAlerts", "id", "newPlantRequest", "newPlantSubmission", "newPlantSuggestion", "newUserSignup", "updatedAt", "userDeleted", "weeklyDigest" FROM "AdminNotificationSettings";
DROP TABLE "AdminNotificationSettings";
ALTER TABLE "new_AdminNotificationSettings" RENAME TO "AdminNotificationSettings";
CREATE UNIQUE INDEX "AdminNotificationSettings_adminEmail_key" ON "AdminNotificationSettings"("adminEmail");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "SwapReport_status_idx" ON "SwapReport"("status");

-- CreateIndex
CREATE INDEX "SwapReport_reporterId_idx" ON "SwapReport"("reporterId");

-- CreateIndex
CREATE INDEX "SwapReport_reportedUserId_idx" ON "SwapReport"("reportedUserId");

-- CreateIndex
CREATE INDEX "UserBlock_blockedId_idx" ON "UserBlock"("blockedId");

-- CreateIndex
CREATE UNIQUE INDEX "UserBlock_blockerId_blockedId_key" ON "UserBlock"("blockerId", "blockedId");
