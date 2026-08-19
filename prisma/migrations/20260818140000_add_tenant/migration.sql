-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- Seed do único tenant real (a empresa atual). Todas as linhas existentes
-- nas tabelas abaixo pertencem a esse tenant.
INSERT INTO "tenants" ("id", "name", "slug", "active", "updatedAt")
VALUES ('4994caa6-429e-47ae-b6db-c82fe6e0ce13', 'Empresa Principal', 'principal', true, CURRENT_TIMESTAMP);

-- AddColumn (nullable) + Backfill + SetNotNull + AddForeignKey + CreateIndex,
-- uma tabela por vez, nessa ordem pra não quebrar em cima de dado existente.

-- roles
ALTER TABLE "roles" ADD COLUMN "tenantId" TEXT;
UPDATE "roles" SET "tenantId" = '4994caa6-429e-47ae-b6db-c82fe6e0ce13';
ALTER TABLE "roles" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "roles" ALTER COLUMN "tenantId" SET DEFAULT '4994caa6-429e-47ae-b6db-c82fe6e0ce13';
CREATE INDEX "roles_tenantId_idx" ON "roles"("tenantId");
ALTER TABLE "roles" ADD CONSTRAINT "roles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- users
ALTER TABLE "users" ADD COLUMN "tenantId" TEXT;
UPDATE "users" SET "tenantId" = '4994caa6-429e-47ae-b6db-c82fe6e0ce13';
ALTER TABLE "users" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "users" ALTER COLUMN "tenantId" SET DEFAULT '4994caa6-429e-47ae-b6db-c82fe6e0ce13';
CREATE INDEX "users_tenantId_idx" ON "users"("tenantId");
ALTER TABLE "users" ADD CONSTRAINT "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- customers
ALTER TABLE "customers" ADD COLUMN "tenantId" TEXT;
UPDATE "customers" SET "tenantId" = '4994caa6-429e-47ae-b6db-c82fe6e0ce13';
ALTER TABLE "customers" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "customers" ALTER COLUMN "tenantId" SET DEFAULT '4994caa6-429e-47ae-b6db-c82fe6e0ce13';
CREATE INDEX "customers_tenantId_idx" ON "customers"("tenantId");
ALTER TABLE "customers" ADD CONSTRAINT "customers_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- categories
ALTER TABLE "categories" ADD COLUMN "tenantId" TEXT;
UPDATE "categories" SET "tenantId" = '4994caa6-429e-47ae-b6db-c82fe6e0ce13';
ALTER TABLE "categories" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "categories" ALTER COLUMN "tenantId" SET DEFAULT '4994caa6-429e-47ae-b6db-c82fe6e0ce13';
CREATE INDEX "categories_tenantId_idx" ON "categories"("tenantId");
ALTER TABLE "categories" ADD CONSTRAINT "categories_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- tags
ALTER TABLE "tags" ADD COLUMN "tenantId" TEXT;
UPDATE "tags" SET "tenantId" = '4994caa6-429e-47ae-b6db-c82fe6e0ce13';
ALTER TABLE "tags" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "tags" ALTER COLUMN "tenantId" SET DEFAULT '4994caa6-429e-47ae-b6db-c82fe6e0ce13';
CREATE INDEX "tags_tenantId_idx" ON "tags"("tenantId");
ALTER TABLE "tags" ADD CONSTRAINT "tags_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- sla_rules
ALTER TABLE "sla_rules" ADD COLUMN "tenantId" TEXT;
UPDATE "sla_rules" SET "tenantId" = '4994caa6-429e-47ae-b6db-c82fe6e0ce13';
ALTER TABLE "sla_rules" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "sla_rules" ALTER COLUMN "tenantId" SET DEFAULT '4994caa6-429e-47ae-b6db-c82fe6e0ce13';
CREATE INDEX "sla_rules_tenantId_idx" ON "sla_rules"("tenantId");
ALTER TABLE "sla_rules" ADD CONSTRAINT "sla_rules_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- tickets
ALTER TABLE "tickets" ADD COLUMN "tenantId" TEXT;
UPDATE "tickets" SET "tenantId" = '4994caa6-429e-47ae-b6db-c82fe6e0ce13';
ALTER TABLE "tickets" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "tickets" ALTER COLUMN "tenantId" SET DEFAULT '4994caa6-429e-47ae-b6db-c82fe6e0ce13';
CREATE INDEX "tickets_tenantId_idx" ON "tickets"("tenantId");
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- appointments
ALTER TABLE "appointments" ADD COLUMN "tenantId" TEXT;
UPDATE "appointments" SET "tenantId" = '4994caa6-429e-47ae-b6db-c82fe6e0ce13';
ALTER TABLE "appointments" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "appointments" ALTER COLUMN "tenantId" SET DEFAULT '4994caa6-429e-47ae-b6db-c82fe6e0ce13';
CREATE INDEX "appointments_tenantId_idx" ON "appointments"("tenantId");
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- integrations
ALTER TABLE "integrations" ADD COLUMN "tenantId" TEXT;
UPDATE "integrations" SET "tenantId" = '4994caa6-429e-47ae-b6db-c82fe6e0ce13';
ALTER TABLE "integrations" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "integrations" ALTER COLUMN "tenantId" SET DEFAULT '4994caa6-429e-47ae-b6db-c82fe6e0ce13';
CREATE INDEX "integrations_tenantId_idx" ON "integrations"("tenantId");
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- totalchat_config
ALTER TABLE "totalchat_config" ADD COLUMN "tenantId" TEXT;
UPDATE "totalchat_config" SET "tenantId" = '4994caa6-429e-47ae-b6db-c82fe6e0ce13';
ALTER TABLE "totalchat_config" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "totalchat_config" ALTER COLUMN "tenantId" SET DEFAULT '4994caa6-429e-47ae-b6db-c82fe6e0ce13';
CREATE INDEX "totalchat_config_tenantId_idx" ON "totalchat_config"("tenantId");
ALTER TABLE "totalchat_config" ADD CONSTRAINT "totalchat_config_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ch_erp_config
ALTER TABLE "ch_erp_config" ADD COLUMN "tenantId" TEXT;
UPDATE "ch_erp_config" SET "tenantId" = '4994caa6-429e-47ae-b6db-c82fe6e0ce13';
ALTER TABLE "ch_erp_config" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "ch_erp_config" ALTER COLUMN "tenantId" SET DEFAULT '4994caa6-429e-47ae-b6db-c82fe6e0ce13';
CREATE INDEX "ch_erp_config_tenantId_idx" ON "ch_erp_config"("tenantId");
ALTER TABLE "ch_erp_config" ADD CONSTRAINT "ch_erp_config_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
