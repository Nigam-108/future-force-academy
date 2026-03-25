ALTER TABLE "TestPurchase"
ADD COLUMN "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "validUntil" TIMESTAMP(3);

CREATE INDEX "TestPurchase_status_validUntil_idx"
ON "TestPurchase"("status", "validUntil");

CREATE INDEX "TestPurchase_userId_batchId_status_idx"
ON "TestPurchase"("userId", "batchId", "status");
