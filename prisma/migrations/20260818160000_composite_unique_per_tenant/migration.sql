-- Últimas 6 constraints únicas globais viram compostas com tenantId — cada
-- tenant passa a poder ter, por exemplo, um cliente com o mesmo CNPJ que um
-- cliente de outro tenant, sem colidir. (Role.name já foi feito numa migration
-- anterior; Permission.key, User.email e Ticket.number ficam globais de
-- propósito — ver TENANT em schema.prisma.)

-- users.totalchatAttendantId
DROP INDEX "users_totalchatAttendantId_key";
CREATE UNIQUE INDEX "users_tenantId_totalchatAttendantId_key" ON "users"("tenantId", "totalchatAttendantId");

-- customers.cnpj
DROP INDEX "customers_cnpj_key";
CREATE UNIQUE INDEX "customers_tenantId_cnpj_key" ON "customers"("tenantId", "cnpj");

-- categories.name
DROP INDEX "categories_name_key";
CREATE UNIQUE INDEX "categories_tenantId_name_key" ON "categories"("tenantId", "name");

-- tags.name
DROP INDEX "tags_name_key";
CREATE UNIQUE INDEX "tags_tenantId_name_key" ON "tags"("tenantId", "name");

-- sla_rules.priority
DROP INDEX "sla_rules_priority_key";
CREATE UNIQUE INDEX "sla_rules_tenantId_priority_key" ON "sla_rules"("tenantId", "priority");

-- integrations.provider
DROP INDEX "integrations_provider_key";
CREATE UNIQUE INDEX "integrations_tenantId_provider_key" ON "integrations"("tenantId", "provider");
