-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "emailVerified" DATETIME,
    "passwordHash" TEXT,
    "name" TEXT,
    "username" TEXT,
    "image" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "pendingEmail" TEXT,
    "emailChangeToken" TEXT,
    "emailChangeExpires" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SignupData" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "username" TEXT,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Seed" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "nickname" TEXT,
    "variety" TEXT,
    "brand" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "quantityUnit" TEXT NOT NULL DEFAULT 'seeds',
    "purchaseDate" DATETIME,
    "expirationDate" DATETIME,
    "daysToGerminate" INTEGER,
    "daysToMaturity" INTEGER,
    "sunRequirement" TEXT,
    "waterNeeds" TEXT,
    "spacing" TEXT,
    "plantingDepth" TEXT,
    "notes" TEXT,
    "imageUrl" TEXT,
    "lotNumber" TEXT,
    "source" TEXT,
    "plantTypeId" TEXT,
    "customPlantName" TEXT,
    "customCategory" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "enableIndoorStartReminder" BOOLEAN NOT NULL DEFAULT false,
    "enableDirectSowReminder" BOOLEAN NOT NULL DEFAULT false,
    "enableTransplantReminder" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Seed_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Seed_plantTypeId_fkey" FOREIGN KEY ("plantTypeId") REFERENCES "PlantingGuide" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Planting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "seedId" TEXT NOT NULL,
    "locationId" TEXT,
    "locationName" TEXT NOT NULL,
    "quantityPlanted" INTEGER NOT NULL DEFAULT 1,
    "harvestDate" DATETIME,
    "actualYield" TEXT,
    "status" TEXT NOT NULL DEFAULT 'planted',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Planting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Planting_seedId_fkey" FOREIGN KEY ("seedId") REFERENCES "Seed" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Planting_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "GardenLocation" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlantingEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "plantingId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "quantity" INTEGER,
    "method" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PlantingEvent_plantingId_fkey" FOREIGN KEY ("plantingId") REFERENCES "Planting" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WishlistItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "plantTypeId" TEXT,
    "customPlantName" TEXT,
    "indoorStartWeeks" INTEGER,
    "outdoorStartWeeks" INTEGER,
    "variety" TEXT,
    "brand" TEXT,
    "estimatedPrice" REAL,
    "priority" INTEGER NOT NULL DEFAULT 3,
    "sourceUrl" TEXT,
    "notes" TEXT,
    "purchased" BOOLEAN NOT NULL DEFAULT false,
    "purchasedDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WishlistItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WishlistItem_plantTypeId_fkey" FOREIGN KEY ("plantTypeId") REFERENCES "PlantingGuide" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GardenLocation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sunExposure" TEXT,
    "soilType" TEXT,
    "size" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GardenLocation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "zipCode" TEXT,
    "hardinessZone" TEXT,
    "lastFrostDate" DATETIME,
    "firstFrostDate" DATETIME,
    "latitude" REAL,
    "longitude" REAL,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "plantingReminders" BOOLEAN NOT NULL DEFAULT true,
    "enableIndoorStartReminders" BOOLEAN NOT NULL DEFAULT false,
    "enableDirectSowReminders" BOOLEAN NOT NULL DEFAULT false,
    "enableTransplantReminders" BOOLEAN NOT NULL DEFAULT false,
    "reminderLeadDays" INTEGER NOT NULL DEFAULT 7,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlantingGuide" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "scientificName" TEXT,
    "description" TEXT,
    "generalInfo" TEXT,
    "funFacts" TEXT,
    "variations" TEXT,
    "hardinessZones" TEXT,
    "optimalZones" TEXT,
    "zoneNotes" TEXT,
    "culinaryUses" TEXT,
    "recipes" TEXT,
    "flavorProfile" TEXT,
    "nutritionalInfo" TEXT,
    "medicinalUses" TEXT,
    "holisticUses" TEXT,
    "cautions" TEXT,
    "craftIdeas" TEXT,
    "history" TEXT,
    "culturalSignificance" TEXT,
    "indoorStartWeeks" INTEGER,
    "outdoorStartWeeks" INTEGER,
    "transplantWeeks" INTEGER,
    "harvestWeeks" INTEGER,
    "daysToGerminate" INTEGER,
    "daysToMaturity" INTEGER,
    "minGerminationTemp" INTEGER,
    "optGerminationTemp" INTEGER,
    "minGrowingTemp" INTEGER,
    "maxGrowingTemp" INTEGER,
    "sunRequirement" TEXT,
    "waterNeeds" TEXT,
    "soilPH" TEXT,
    "spacing" TEXT,
    "plantingDepth" TEXT,
    "rowSpacing" TEXT,
    "plantsPerSquareFoot" REAL,
    "companionPlants" TEXT,
    "avoidPlants" TEXT,
    "commonPests" TEXT,
    "commonDiseases" TEXT,
    "organicPestControl" TEXT,
    "harvestTips" TEXT,
    "storageTips" TEXT,
    "preservationMethods" TEXT,
    "notes" TEXT,
    "imageUrl" TEXT,
    "isUserSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "isApproved" BOOLEAN NOT NULL DEFAULT true,
    "submittedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PlantingGuide_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlantSuggestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "plantId" TEXT NOT NULL,
    "userId" TEXT,
    "userEmail" TEXT,
    "userName" TEXT,
    "section" TEXT NOT NULL,
    "suggestionType" TEXT NOT NULL,
    "currentContent" TEXT,
    "suggestedContent" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "adminNotes" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PlantSuggestion_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "PlantingGuide" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlantRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "plantName" TEXT NOT NULL,
    "category" TEXT,
    "scientificName" TEXT,
    "description" TEXT,
    "reason" TEXT,
    "additionalInfo" TEXT,
    "sourceUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "adminNotes" TEXT,
    "votes" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PlantRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "adminId" TEXT NOT NULL,
    "adminEmail" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "targetEmail" TEXT,
    "reason" TEXT,
    "details" TEXT,
    "previousState" TEXT,
    "newState" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AdminNotificationSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "adminEmail" TEXT NOT NULL,
    "newUserSignup" BOOLEAN NOT NULL DEFAULT true,
    "userDeleted" BOOLEAN NOT NULL DEFAULT false,
    "newPlantSubmission" BOOLEAN NOT NULL DEFAULT true,
    "newPlantSuggestion" BOOLEAN NOT NULL DEFAULT true,
    "newPlantRequest" BOOLEAN NOT NULL DEFAULT true,
    "dailyDigest" BOOLEAN NOT NULL DEFAULT false,
    "weeklyDigest" BOOLEAN NOT NULL DEFAULT true,
    "errorAlerts" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PlantingReminderLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "plantNames" TEXT NOT NULL,
    "reminderType" TEXT NOT NULL,
    "targetDate" DATETIME NOT NULL,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "year" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "CsrfToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "SignupData_email_key" ON "SignupData"("email");

-- CreateIndex
CREATE INDEX "SignupData_expiresAt_idx" ON "SignupData"("expiresAt");

-- CreateIndex
CREATE INDEX "Seed_userId_idx" ON "Seed"("userId");

-- CreateIndex
CREATE INDEX "Planting_userId_idx" ON "Planting"("userId");

-- CreateIndex
CREATE INDEX "PlantingEvent_plantingId_idx" ON "PlantingEvent"("plantingId");

-- CreateIndex
CREATE INDEX "WishlistItem_userId_idx" ON "WishlistItem"("userId");

-- CreateIndex
CREATE INDEX "GardenLocation_userId_idx" ON "GardenLocation"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PlantingGuide_name_key" ON "PlantingGuide"("name");

-- CreateIndex
CREATE INDEX "PlantSuggestion_plantId_idx" ON "PlantSuggestion"("plantId");

-- CreateIndex
CREATE INDEX "PlantSuggestion_status_idx" ON "PlantSuggestion"("status");

-- CreateIndex
CREATE INDEX "PlantRequest_userId_idx" ON "PlantRequest"("userId");

-- CreateIndex
CREATE INDEX "PlantRequest_status_idx" ON "PlantRequest"("status");

-- CreateIndex
CREATE INDEX "AdminAuditLog_adminId_idx" ON "AdminAuditLog"("adminId");

-- CreateIndex
CREATE INDEX "AdminAuditLog_targetId_idx" ON "AdminAuditLog"("targetId");

-- CreateIndex
CREATE INDEX "AdminAuditLog_targetEmail_idx" ON "AdminAuditLog"("targetEmail");

-- CreateIndex
CREATE INDEX "AdminAuditLog_action_idx" ON "AdminAuditLog"("action");

-- CreateIndex
CREATE INDEX "AdminAuditLog_createdAt_idx" ON "AdminAuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AdminNotificationSettings_adminEmail_key" ON "AdminNotificationSettings"("adminEmail");

-- CreateIndex
CREATE INDEX "PlantingReminderLog_userId_idx" ON "PlantingReminderLog"("userId");

-- CreateIndex
CREATE INDEX "PlantingReminderLog_userId_reminderType_year_idx" ON "PlantingReminderLog"("userId", "reminderType", "year");

-- CreateIndex
CREATE UNIQUE INDEX "CsrfToken_token_key" ON "CsrfToken"("token");

-- CreateIndex
CREATE INDEX "CsrfToken_sessionId_idx" ON "CsrfToken"("sessionId");

-- CreateIndex
CREATE INDEX "CsrfToken_expiresAt_idx" ON "CsrfToken"("expiresAt");

