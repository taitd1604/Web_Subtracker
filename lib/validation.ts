import { Prisma } from "@prisma/client";
import { z } from "zod";

import { isValidDateOnlyInput, parseDateOnlyInput } from "@/lib/date-only";

const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format");

const moneyStringSchema = z
  .string()
  .trim()
  .regex(/^\d+(\.\d+)?$/, "Amount must be a positive number");

const subscriptionInputSchema = z
  .object({
    id: z.string().uuid().optional(),
    name: z.string().trim().min(1, "Name is required"),
    totalAmount: moneyStringSchema,
    currency: z.enum(["VND", "USD"]),
    costMode: z.enum(["full", "split", "fixed"]),
    splitTotalUsers: z.string().trim().optional(),
    myShare: z.string().trim().optional(),
    fixedAmount: z.string().trim().optional(),
    billingType: z.enum(["monthly", "yearly"]),
    billingInterval: z.coerce
      .number({ invalid_type_error: "Billing interval must be a number" })
      .int("Billing interval must be an integer")
      .positive("Billing interval must be greater than 0"),
    nextBillingDate: dateStringSchema,
    note: z.string().trim().max(500).optional()
  })
  .superRefine((data, ctx) => {
    const totalAmountDecimal = new Prisma.Decimal(data.totalAmount);
    if (totalAmountDecimal.lte(0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["totalAmount"],
        message: "Total amount must be greater than 0"
      });
    }

    if (data.costMode === "split") {
      const splitTotalUsers = Number(data.splitTotalUsers);
      const myShare = Number(data.myShare);

      if (!Number.isInteger(splitTotalUsers) || splitTotalUsers <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["splitTotalUsers"],
          message: "Split total users must be a positive integer"
        });
      }

      if (!Number.isInteger(myShare) || myShare <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["myShare"],
          message: "My share must be a positive integer"
        });
      }

      if (
        Number.isInteger(splitTotalUsers) &&
        Number.isInteger(myShare) &&
        myShare > splitTotalUsers
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["myShare"],
          message: "My share cannot be greater than split total users"
        });
      }
    }

    if (data.costMode === "fixed") {
      const fixedAmount = data.fixedAmount;
      if (!fixedAmount || !/^\d+(\.\d+)?$/.test(fixedAmount)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["fixedAmount"],
          message: "Fixed amount is required and must be numeric"
        });
        return;
      }

      const fixedAmountDecimal = new Prisma.Decimal(fixedAmount);
      if (fixedAmountDecimal.lte(0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["fixedAmount"],
          message: "Fixed amount must be greater than 0"
        });
      }
    }

    if (!isValidDateOnlyInput(data.nextBillingDate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["nextBillingDate"],
        message: "Next billing date is invalid"
      });
    }
  });

export type SubscriptionPayload = {
  id?: string;
  name: string;
  totalAmount: Prisma.Decimal;
  currency: "VND" | "USD";
  costMode: "full" | "split" | "fixed";
  splitTotalUsers: number | null;
  myShare: number | null;
  fixedAmount: Prisma.Decimal | null;
  billingType: "monthly" | "yearly";
  billingInterval: number;
  nextBillingDate: Date;
  note: string | null;
};

export function parseSubscriptionFormData(formData: FormData) {
  const parsed = subscriptionInputSchema.safeParse({
    id: formData.get("id")?.toString(),
    name: formData.get("name")?.toString() ?? "",
    totalAmount: formData.get("totalAmount")?.toString() ?? "",
    currency: formData.get("currency")?.toString(),
    costMode: formData.get("costMode")?.toString(),
    splitTotalUsers: formData.get("splitTotalUsers")?.toString(),
    myShare: formData.get("myShare")?.toString(),
    fixedAmount: formData.get("fixedAmount")?.toString(),
    billingType: formData.get("billingType")?.toString(),
    billingInterval: formData.get("billingInterval")?.toString(),
    nextBillingDate: formData.get("nextBillingDate")?.toString() ?? "",
    note: formData.get("note")?.toString()
  });

  if (!parsed.success) {
    return parsed;
  }

  const data = parsed.data;

  const payload: SubscriptionPayload = {
    ...(data.id ? { id: data.id } : {}),
    name: data.name,
    totalAmount: new Prisma.Decimal(data.totalAmount),
    currency: data.currency,
    costMode: data.costMode,
    splitTotalUsers:
      data.costMode === "split" ? Number(data.splitTotalUsers) : null,
    myShare: data.costMode === "split" ? Number(data.myShare) : null,
    fixedAmount:
      data.costMode === "fixed" && data.fixedAmount
        ? new Prisma.Decimal(data.fixedAmount)
        : null,
    billingType: data.billingType,
    billingInterval: data.billingInterval,
    nextBillingDate: parseDateOnlyInput(data.nextBillingDate),
    note: data.note ? data.note : null
  };

  return {
    success: true as const,
    data: payload
  };
}
