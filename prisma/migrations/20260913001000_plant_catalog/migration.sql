-- AlterTable
ALTER TABLE "PlantingGuide" ADD COLUMN "commonNames" TEXT;
ALTER TABLE "PlantingGuide" ADD COLUMN "sourceData" TEXT;
ALTER TABLE "PlantingGuide" ADD COLUMN "sourceId" TEXT;
ALTER TABLE "PlantingGuide" ADD COLUMN "sourceLicense" TEXT;
ALTER TABLE "PlantingGuide" ADD COLUMN "sourceName" TEXT;
ALTER TABLE "PlantingGuide" ADD COLUMN "sourceRetrievedAt" DATETIME;
ALTER TABLE "PlantingGuide" ADD COLUMN "sourceUrl" TEXT;

-- CreateIndex
CREATE INDEX "PlantingGuide_scientificName_idx" ON "PlantingGuide"("scientificName");

-- CreateIndex
CREATE INDEX "PlantingGuide_category_name_idx" ON "PlantingGuide"("category", "name");

-- CreateIndex
CREATE UNIQUE INDEX "PlantingGuide_sourceName_sourceId_key" ON "PlantingGuide"("sourceName", "sourceId");
