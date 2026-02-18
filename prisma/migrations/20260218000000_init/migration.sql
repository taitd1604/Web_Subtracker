-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('VND', 'USD');

-- CreateEnum
CREATE TYPE "CostMode" AS ENUM ('full', 'split', 'fixed');

-- CreateEnum
CREATE TYPE "BillingType" AS ENUM ('monthly', 'yearly');

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "totalAmount" DECIMAL(18,4) NOT NULL,
    "currency" "Currency" NOT NULL,
    "costMode" "CostMode" NOT NULL,
    "splitTotalUsers" INTEGER,
    "myShare" INTEGER,
    "fixedAmount" DECIMAL(18,4),
    "billingType" "BillingType" NOT NULL,
    "billingInterval" INTEGER NOT NULL,
    "nextBillingDate" DATE NOT NULL,
    "note" TEXT,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Subscription_archivedAt_idx" ON "Subscription"("archivedAt");

-- CreateIndex
CREATE INDEX "Subscription_nextBillingDate_idx" ON "Subscription"("nextBillingDate");
