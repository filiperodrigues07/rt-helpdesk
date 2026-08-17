-- AlterEnum
ALTER TYPE "IntegrationProvider" ADD VALUE 'CH_ERP';

-- CreateTable
CREATE TABLE "ch_erp_config" (
    "id" TEXT NOT NULL,
    "baseUrl" TEXT,
    "token" TEXT,
    "cnpjPrincipal" TEXT,
    "chaveEmpresa" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ch_erp_config_pkey" PRIMARY KEY ("id")
);
