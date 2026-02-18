import { Prisma } from "@prisma/client";
import { z } from "zod";

import { isValidDateOnlyInput, parseDateOnlyInput } from "@/lib/date-only";

const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày phải theo định dạng YYYY-MM-DD");

const moneyStringSchema = z
  .string()
  .trim()
  .regex(/^\d+(\.\d+)?$/, "Số tiền phải là số dương");

const subscriptionInputSchema = z
  .object({
    id: z.string().uuid().optional(),
    name: z.string().trim().min(1, "Vui lòng nhập tên dịch vụ"),
    totalAmount: moneyStringSchema,
    currency: z.enum(["VND", "USD"]),
    costMode: z.enum(["full", "split", "fixed"]),
    splitTotalUsers: z.string().trim().optional(),
    myShare: z.string().trim().optional(),
    fixedAmount: z.string().trim().optional(),
    billingType: z.enum(["monthly", "yearly"]),
    billingInterval: z.coerce
      .number({ invalid_type_error: "Chu kỳ lặp phải là số" })
      .int("Chu kỳ lặp phải là số nguyên")
      .positive("Chu kỳ lặp phải lớn hơn 0"),
    nextBillingDate: dateStringSchema,
    note: z.string().trim().max(500).optional()
  })
  .superRefine((data, ctx) => {
    const totalAmountDecimal = new Prisma.Decimal(data.totalAmount);
    if (totalAmountDecimal.lte(0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["totalAmount"],
        message: "Tổng tiền phải lớn hơn 0"
      });
    }

    if (data.costMode === "split") {
      const splitTotalUsers = Number(data.splitTotalUsers);
      const myShare = Number(data.myShare);

      if (!Number.isInteger(splitTotalUsers) || splitTotalUsers <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["splitTotalUsers"],
          message: "Tổng số người dùng chung phải là số nguyên dương"
        });
      }

      if (!Number.isInteger(myShare) || myShare <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["myShare"],
          message: "Số phần của bạn phải là số nguyên dương"
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
          message: "Số phần của bạn không thể lớn hơn tổng số người dùng chung"
        });
      }
    }

    if (data.costMode === "fixed") {
      const fixedAmount = data.fixedAmount;
      if (!fixedAmount || !/^\d+(\.\d+)?$/.test(fixedAmount)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["fixedAmount"],
          message: "Vui lòng nhập số tiền cố định hợp lệ"
        });
        return;
      }

      const fixedAmountDecimal = new Prisma.Decimal(fixedAmount);
      if (fixedAmountDecimal.lte(0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["fixedAmount"],
          message: "Số tiền cố định phải lớn hơn 0"
        });
      }
    }

    if (!isValidDateOnlyInput(data.nextBillingDate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["nextBillingDate"],
        message: "Ngày thanh toán kế tiếp không hợp lệ"
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
