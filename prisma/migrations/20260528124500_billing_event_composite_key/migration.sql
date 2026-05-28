-- DropIndex
DROP INDEX IF EXISTS "BillingEvent_asaasPaymentId_key";

-- CreateIndex
CREATE UNIQUE INDEX "BillingEvent_asaasPaymentId_event_key" ON "BillingEvent"("asaasPaymentId", "event");
