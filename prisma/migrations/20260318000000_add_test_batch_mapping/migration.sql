-- CreateTable
CREATE TABLE "TestBatch" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TestBatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TestBatch_testId_batchId_key" ON "TestBatch"("testId", "batchId");

-- AddForeignKey
ALTER TABLE "TestBatch" ADD CONSTRAINT "TestBatch_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey 
ALTER TABLE "TestBatch" ADD CONSTRAINT "TestBatch_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

