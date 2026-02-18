import { BillingType, CostMode, Currency, Prisma } from "@prisma/client";

type CostInput = {
  totalAmount: Prisma.Decimal;
  costMode: CostMode;
  splitTotalUsers: number | null;
  myShare: number | null;
  fixedAmount: Prisma.Decimal | null;
  billingType: BillingType;
  billingInterval: number;
};

const USD_DECIMALS = 2;
const VND_DECIMALS = 0;

export function getIntervalMonths(
  billingType: BillingType,
  billingInterval: number
): number {
  return billingType === "yearly" ? billingInterval * 12 : billingInterval;
}

export function calculateMyCost(input: CostInput): Prisma.Decimal {
  switch (input.costMode) {
    case "full":
      return input.totalAmount;
    case "split": {
      if (!input.splitTotalUsers || !input.myShare) {
        return new Prisma.Decimal(0);
      }
      return input.totalAmount.mul(input.myShare).div(input.splitTotalUsers);
    }
    case "fixed":
      return input.fixedAmount ?? new Prisma.Decimal(0);
    default:
      return new Prisma.Decimal(0);
  }
}

export function calculateMonthlyCost(input: CostInput): Prisma.Decimal {
  const myCost = calculateMyCost(input);
  // Normalize every billing cycle to a per-month value for dashboard KPIs.
  const months = getIntervalMonths(input.billingType, input.billingInterval);
  return myCost.div(months);
}

export function formatMoney(
  amount: Prisma.Decimal | number,
  currency: Currency
): string {
  const value = amount instanceof Prisma.Decimal ? amount.toNumber() : amount;
  const digits = currency === "USD" ? USD_DECIMALS : VND_DECIMALS;
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(value);
}
