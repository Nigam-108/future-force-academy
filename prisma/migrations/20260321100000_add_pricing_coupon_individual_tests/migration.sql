-- ─── Batch pricing fields ───────────────────────────────────────────────────
ALTER TABLE "Batch" ADD COLUMN "price" INTEGER;
ALTER TABLE "Batch" ADD COLUMN "originalPrice" INTEGER;
ALTER TABLE "Batch" ADD COLUMN "offerEndDate" TIMESTAMP(3);

-- ─── Per-test price on TestBatch ────────────────────────────────────────────
ALTER TABLE "TestBatch" ADD COLUMN "price" INTEGER;

-- ─── New enums ───────────────────────────────────────────────────────────────
CREATE TYPE "PurchaseType" AS ENUM ('FULL_BATCH', 'INDIVIDUAL_TESTS');
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FLAT');

-- ─── Add purchaseType to existing Purchase ───────────────────────────────────
ALTER TABLE "Purchase" ADD COLUMN "purchaseType" "PurchaseType" NOT NULL DEFAULT 'FULL_BATCH';

-- ─── Add coupon + discount fields to Payment ────────────────────────────────
ALTER TABLE "Payment" ADD COLUMN "couponId" TEXT;
ALTER TABLE "Payment" ADD COLUMN "discountAmount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Payment" ADD COLUMN "originalAmount" INTEGER;
ALTER TABLE "Payment" ADD COLUMN "purchaseType" "PurchaseType" NOT NULL DEFAULT 'FULL_BATCH';

-- ─── Coupon table ────────────────────────────────────────────────────────────
CREATE TABLE "Coupon" (
    "id"              TEXT NOT NULL,
    "code"            TEXT NOT NULL,
    "description"     TEXT,
    "discountType"    "DiscountType" NOT NULL,
    "discountValue"   INTEGER NOT NULL,
    "maxUsageLimit"   INTEGER,
    "perStudentLimit" INTEGER NOT NULL DEFAULT 1,
    "batchId"         TEXT,
    "expiresAt"       TIMESTAMP(3),
    "isActive"        BOOLEAN NOT NULL DEFAULT true,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");

ALTER TABLE "Coupon" ADD CONSTRAINT "Coupon_batchId_fkey"
  FOREIGN KEY ("batchId") REFERENCES "Batch"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Payment" ADD CONSTRAINT "Payment_couponId_fkey"
  FOREIGN KEY ("couponId") REFERENCES "Coupon"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- ─── CouponUsage table ───────────────────────────────────────────────────────
CREATE TABLE "CouponUsage" (
    "id"              TEXT NOT NULL,
    "couponId"        TEXT NOT NULL,
    "userId"          TEXT NOT NULL,
    "paymentId"       TEXT NOT NULL,
    "discountApplied" INTEGER NOT NULL,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CouponUsage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CouponUsage_paymentId_key" ON "CouponUsage"("paymentId");

ALTER TABLE "CouponUsage" ADD CONSTRAINT "CouponUsage_couponId_fkey"
  FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CouponUsage" ADD CONSTRAINT "CouponUsage_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CouponUsage" ADD CONSTRAINT "CouponUsage_paymentId_fkey"
  FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── TestPurchase table ──────────────────────────────────────────────────────
CREATE TABLE "TestPurchase" (
    "id"        TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "testId"    TEXT NOT NULL,
    "batchId"   TEXT NOT NULL,
    "paymentId" TEXT,
    "status"    "PurchaseStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TestPurchase_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TestPurchase_userId_testId_key" ON "TestPurchase"("userId", "testId");

ALTER TABLE "TestPurchase" ADD CONSTRAINT "TestPurchase_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TestPurchase" ADD CONSTRAINT "TestPurchase_testId_fkey"
  FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TestPurchase" ADD CONSTRAINT "TestPurchase_batchId_fkey"
  FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TestPurchase" ADD CONSTRAINT "TestPurchase_paymentId_fkey"
  FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;