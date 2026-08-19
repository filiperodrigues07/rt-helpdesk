-- Role deixa de ser um catálogo global único por nome e passa a ter uma
-- linha por tenant (cada tenant seeda seus próprios ADMINISTRADOR/GERENTE/
-- SUPORTE/IMPLANTACAO/VISUALIZACAO). Sem isso, dois tenants não conseguem
-- coexistir: o segundo esbarraria no unique constraint global de "roles"."name".

-- DropIndex
DROP INDEX "roles_name_key";

-- CreateIndex
CREATE UNIQUE INDEX "roles_tenantId_name_key" ON "roles"("tenantId", "name");
