-- CreateTable
CREATE TABLE "MembershipUnit" (
    "membershipId" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,

    CONSTRAINT "MembershipUnit_pkey" PRIMARY KEY ("membershipId","establishmentId")
);

-- CreateIndex
CREATE INDEX "MembershipUnit_establishmentId_idx" ON "MembershipUnit"("establishmentId");

-- AddForeignKey
ALTER TABLE "MembershipUnit" ADD CONSTRAINT "MembershipUnit_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipUnit" ADD CONSTRAINT "MembershipUnit_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
