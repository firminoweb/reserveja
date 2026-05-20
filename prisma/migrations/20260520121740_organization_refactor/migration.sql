-- Refator: introduz Organization como pai de Establishment. Establishment
-- vira "unidade/filial" e Membership liga User a Organization (não mais a
-- Establishment). Status do plano e taxId vão pro nível Organization.

-- Novos enums
CREATE TYPE "OrgStatus" AS ENUM ('ACTIVE', 'TRIAL', 'SUSPENDED');
CREATE TYPE "BusinessCategory" AS ENUM (
    'BARBEARIA',
    'SALAO_BELEZA',
    'MANICURE_PEDICURE',
    'ESTETICA',
    'MASSAGEM_TERAPIA',
    'MECANICA_AUTO',
    'LAVA_RAPIDO',
    'PET_SHOP',
    'CLINICA_SAUDE',
    'ESTUDIO_TATUAGEM',
    'OUTRO'
);

-- Nova tabela Organization
CREATE TABLE "Organization" (
    "id"             TEXT             NOT NULL,
    "name"           TEXT             NOT NULL,
    "category"       "BusinessCategory" NOT NULL DEFAULT 'OUTRO',
    "taxId"          TEXT,
    "status"         "OrgStatus"      NOT NULL DEFAULT 'TRIAL',
    "planLimitUnits" INTEGER          NOT NULL DEFAULT 1,
    "planLimitUsers" INTEGER          NOT NULL DEFAULT 2,
    "createdAt"      TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3)     NOT NULL,
    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- Backfill: 1 Organization por Establishment existente, herdando status
INSERT INTO "Organization" ("id", "name", "category", "status", "updatedAt")
SELECT 'org_' || "id",
       "name",
       'OUTRO'::"BusinessCategory",
       "status"::text::"OrgStatus",
       NOW()
FROM "Establishment";

-- Adiciona organizationId a Establishment (nullable, depois NOT NULL)
ALTER TABLE "Establishment" ADD COLUMN "organizationId" TEXT;
UPDATE "Establishment" SET "organizationId" = 'org_' || "id";
ALTER TABLE "Establishment" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "Establishment"
    ADD CONSTRAINT "Establishment_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "Establishment_organizationId_idx" ON "Establishment"("organizationId");

-- Membership: muda FK de Establishment pra Organization
ALTER TABLE "Membership" ADD COLUMN "organizationId" TEXT;
UPDATE "Membership" m
   SET "organizationId" = (SELECT e."organizationId" FROM "Establishment" e WHERE e."id" = m."establishmentId");
ALTER TABLE "Membership" ALTER COLUMN "organizationId" SET NOT NULL;

ALTER TABLE "Membership" DROP CONSTRAINT IF EXISTS "Membership_establishmentId_fkey";
DROP INDEX IF EXISTS "Membership_establishmentId_idx";
DROP INDEX IF EXISTS "Membership_userId_establishmentId_key";
ALTER TABLE "Membership" DROP COLUMN "establishmentId";

ALTER TABLE "Membership"
    ADD CONSTRAINT "Membership_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "Membership_organizationId_idx" ON "Membership"("organizationId");
CREATE UNIQUE INDEX "Membership_userId_organizationId_key" ON "Membership"("userId", "organizationId");

-- Status agora vive em Organization — solta da Establishment
ALTER TABLE "Establishment" DROP COLUMN "status";
DROP TYPE "EstablishmentStatus";
