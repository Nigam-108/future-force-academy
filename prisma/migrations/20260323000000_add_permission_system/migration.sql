-- Permission system for role-based access control
-- Supports: default role permissions + per-user overrides
-- ADMIN role always bypasses all checks (handled in code)
-- SUB_ADMIN role checked against this table

CREATE TABLE "Permission" (
    "id"          TEXT NOT NULL,
    "key"         TEXT NOT NULL,
    "label"       TEXT NOT NULL,
    "description" TEXT,
    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Permission_key_key" ON "Permission"("key");

CREATE TABLE "RolePermission" (
    "id"           TEXT NOT NULL,
    "role"         "UserRole" NOT NULL,
    "permissionId" TEXT NOT NULL,
    "granted"      BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RolePermission_role_permissionId_key"
    ON "RolePermission"("role", "permissionId");

ALTER TABLE "RolePermission"
    ADD CONSTRAINT "RolePermission_permissionId_fkey"
    FOREIGN KEY ("permissionId") REFERENCES "Permission"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "UserPermissionOverride" (
    "id"           TEXT NOT NULL,
    "userId"       TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "granted"      BOOLEAN NOT NULL,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserPermissionOverride_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserPermissionOverride_userId_permissionId_key"
    ON "UserPermissionOverride"("userId", "permissionId");

ALTER TABLE "UserPermissionOverride"
    ADD CONSTRAINT "UserPermissionOverride_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserPermissionOverride"
    ADD CONSTRAINT "UserPermissionOverride_permissionId_fkey"
    FOREIGN KEY ("permissionId") REFERENCES "Permission"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

    