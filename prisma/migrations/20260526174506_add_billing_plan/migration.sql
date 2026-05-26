-- CreateEnum
CREATE TYPE "OrgPlan" AS ENUM ('FREE', 'PRO', 'PROFISSIONAL', 'EMPRESARIAL');

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "asaasCustomerId" TEXT,
ADD COLUMN     "asaasSubscriptionId" TEXT,
ADD COLUMN     "plan" "OrgPlan" NOT NULL DEFAULT 'FREE',
ADD COLUMN     "planExpiresAt" TIMESTAMPTZ(3),
ADD COLUMN     "planLimitBookingsPerMonth" INTEGER NOT NULL DEFAULT 50;

-- CreateTable
CREATE TABLE "BillingEvent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "asaasPaymentId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "processedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BillingEvent_asaasPaymentId_key" ON "BillingEvent"("asaasPaymentId");

-- CreateIndex
CREATE INDEX "BillingEvent_organizationId_idx" ON "BillingEvent"("organizationId");

-- CreateIndex
CREATE INDEX "BillingEvent_processedAt_idx" ON "BillingEvent"("processedAt");

-- AddForeignKey
ALTER TABLE "BillingEvent" ADD CONSTRAINT "BillingEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
