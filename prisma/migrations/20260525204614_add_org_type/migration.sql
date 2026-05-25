-- CreateEnum
CREATE TYPE "OrgType" AS ENUM ('EMPRESA', 'AUTONOMO');

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "type" "OrgType" NOT NULL DEFAULT 'EMPRESA';
