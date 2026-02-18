import Link from "next/link";
import { notFound } from "next/navigation";

import {
  archiveSubscriptionAction,
  markSubscriptionBilledAction,
  updateSubscriptionAction
} from "@/app/actions/subscriptions";
import { SubscriptionForm } from "@/app/subscriptions/_components/subscription-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dateOnlyStringFromDb } from "@/lib/date-only";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const backLinkClass =
  "inline-flex h-10 cursor-pointer items-center rounded-xl border border-slate-300 bg-slate-100/70 px-3.5 text-sm font-semibold text-slate-700 shadow-[4px_4px_10px_rgba(148,163,184,0.2),-3px_-3px_8px_rgba(255,255,255,0.85)] transition-colors hover:bg-slate-100";

export default async function EditSubscriptionPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const subscription = await prisma.subscription.findUnique({
    where: { id }
  });

  if (!subscription || subscription.archivedAt) {
    notFound();
  }

  return (
    <main className="container py-8 md:py-10">
      <div className="clay-panel mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Edit Subscription</h1>
        <Link href="/" className={backLinkClass}>
          Back to dashboard
        </Link>
      </div>

      <Card className="mb-5">
        <CardHeader>
          <CardTitle className="text-xl">{subscription.name}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <form action={markSubscriptionBilledAction}>
            <input type="hidden" name="id" value={subscription.id} />
            <Button type="submit" variant="outline">
              Mark as billed
            </Button>
          </form>
          <form action={archiveSubscriptionAction}>
            <input type="hidden" name="id" value={subscription.id} />
            <Button type="submit" variant="destructive">
              Archive
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Subscription details</CardTitle>
        </CardHeader>
        <CardContent>
          <SubscriptionForm
            mode="edit"
            formAction={updateSubscriptionAction}
            initialValues={{
              id: subscription.id,
              name: subscription.name,
              totalAmount: subscription.totalAmount.toString(),
              currency: subscription.currency,
              costMode: subscription.costMode,
              splitTotalUsers: subscription.splitTotalUsers?.toString() ?? "",
              myShare: subscription.myShare?.toString() ?? "",
              fixedAmount: subscription.fixedAmount?.toString() ?? "",
              billingType: subscription.billingType,
              billingInterval: subscription.billingInterval.toString(),
              nextBillingDate: dateOnlyStringFromDb(subscription.nextBillingDate),
              note: subscription.note ?? ""
            }}
          />
        </CardContent>
      </Card>
    </main>
  );
}
