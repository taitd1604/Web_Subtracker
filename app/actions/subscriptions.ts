"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getIntervalMonths } from "@/lib/cost";
import { addMonthsDateOnly } from "@/lib/date-only";
import { prisma } from "@/lib/prisma";
import { parseSubscriptionFormData } from "@/lib/validation";

export type SubscriptionFormState = {
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

const idSchema = z.string().uuid();

export async function createSubscriptionAction(
  _prevState: SubscriptionFormState,
  formData: FormData
): Promise<SubscriptionFormState> {
  const parsed = parseSubscriptionFormData(formData);

  if (!parsed.success) {
    return {
      message: "Please fix the form fields.",
      fieldErrors: parsed.error.flatten().fieldErrors
    };
  }

  const createData = { ...parsed.data };
  delete createData.id;

  await prisma.subscription.create({
    data: createData
  });

  revalidatePath("/");
  redirect("/");
}

export async function updateSubscriptionAction(
  _prevState: SubscriptionFormState,
  formData: FormData
): Promise<SubscriptionFormState> {
  const parsed = parseSubscriptionFormData(formData);

  if (!parsed.success) {
    return {
      message: "Please fix the form fields.",
      fieldErrors: parsed.error.flatten().fieldErrors
    };
  }

  const idResult = idSchema.safeParse(parsed.data.id);
  if (!idResult.success) {
    return {
      message: "Subscription id is invalid."
    };
  }

  const updateData = { ...parsed.data };
  delete updateData.id;

  await prisma.subscription.update({
    where: { id: idResult.data },
    data: updateData
  });

  revalidatePath("/");
  revalidatePath(`/subscriptions/${idResult.data}/edit`);
  redirect("/");
}

export async function archiveSubscriptionAction(formData: FormData) {
  const idResult = idSchema.safeParse(formData.get("id"));
  if (!idResult.success) {
    return;
  }

  await prisma.subscription.update({
    where: { id: idResult.data },
    data: { archivedAt: new Date() }
  });

  revalidatePath("/");
}

export async function markSubscriptionBilledAction(formData: FormData) {
  const idResult = idSchema.safeParse(formData.get("id"));
  if (!idResult.success) {
    return;
  }

  const subscription = await prisma.subscription.findUnique({
    where: { id: idResult.data },
    select: {
      id: true,
      billingType: true,
      billingInterval: true,
      nextBillingDate: true
    }
  });

  if (!subscription) {
    return;
  }

  const monthDelta = getIntervalMonths(
    subscription.billingType,
    subscription.billingInterval
  );
  const nextBillingDate = addMonthsDateOnly(subscription.nextBillingDate, monthDelta);

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: { nextBillingDate }
  });

  revalidatePath("/");
  revalidatePath(`/subscriptions/${subscription.id}/edit`);
}
