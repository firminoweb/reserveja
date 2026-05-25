-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "BusinessCategory" ADD VALUE 'PERSONAL_TRAINER';
ALTER TYPE "BusinessCategory" ADD VALUE 'NUTRICIONISTA';
ALTER TYPE "BusinessCategory" ADD VALUE 'PSICOLOGO';
ALTER TYPE "BusinessCategory" ADD VALUE 'FISIOTERAPEUTA';
ALTER TYPE "BusinessCategory" ADD VALUE 'COACH_CONSULTOR';
ALTER TYPE "BusinessCategory" ADD VALUE 'ADVOGADO';
ALTER TYPE "BusinessCategory" ADD VALUE 'CONTADOR';
ALTER TYPE "BusinessCategory" ADD VALUE 'FOTOGRAFO';
ALTER TYPE "BusinessCategory" ADD VALUE 'PROFESSOR_PARTICULAR';
ALTER TYPE "BusinessCategory" ADD VALUE 'DENTISTA';
ALTER TYPE "BusinessCategory" ADD VALUE 'VETERINARIO';
