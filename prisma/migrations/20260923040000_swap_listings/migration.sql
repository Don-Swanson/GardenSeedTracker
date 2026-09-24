-- CreateTable
CREATE TABLE "SwapListing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "seedId" TEXT,
    "plantTypeId" TEXT,
    "customPlantName" TEXT,
    "variety" TEXT,
    "quantity" TEXT,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "shippingOk" BOOLEAN NOT NULL DEFAULT false,
    "localPickupOk" BOOLEAN NOT NULL DEFAULT true,
    "latitude" REAL,
    "longitude" REAL,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SwapListing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SwapListing_seedId_fkey" FOREIGN KEY ("seedId") REFERENCES "Seed" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SwapListing_plantTypeId_fkey" FOREIGN KEY ("plantTypeId") REFERENCES "PlantingGuide" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "SwapListing_userId_idx" ON "SwapListing"("userId");

-- CreateIndex
CREATE INDEX "SwapListing_status_idx" ON "SwapListing"("status");

-- CreateIndex
CREATE INDEX "SwapListing_type_idx" ON "SwapListing"("type");

-- CreateIndex
CREATE INDEX "SwapListing_latitude_longitude_idx" ON "SwapListing"("latitude", "longitude");
