-- ActivityLog model for admin audit trail
-- Tracks every significant admin action: who, what, when, on which resource
-- Indexed on userId, action, resourceType+resourceId, and createdAt for fast filtering

CREATE TABLE "ActivityLog" (
    "id"           TEXT NOT NULL,
    "userId"       TEXT NOT NULL,
    "userFullName" TEXT NOT NULL,
    "action"       TEXT NOT NULL,
    "description"  TEXT NOT NULL,
    "resourceType" TEXT,
    "resourceId"   TEXT,
    "metadata"     JSONB,
    "ipAddress"    TEXT,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- Indexes for fast filtering in the activity logs page
CREATE INDEX "ActivityLog_userId_idx"                   ON "ActivityLog"("userId");
CREATE INDEX "ActivityLog_action_idx"                   ON "ActivityLog"("action");
CREATE INDEX "ActivityLog_resourceType_resourceId_idx"  ON "ActivityLog"("resourceType", "resourceId");
CREATE INDEX "ActivityLog_createdAt_idx"                ON "ActivityLog"("createdAt");

ALTER TABLE "ActivityLog"
    ADD CONSTRAINT "ActivityLog_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;