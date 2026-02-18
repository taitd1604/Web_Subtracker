import { Prisma } from "@prisma/client";
import { AlertCircle, CalendarClock, Plus } from "lucide-react";
import Link from "next/link";

import {
  archiveSubscriptionAction,
  markSubscriptionBilledAction
} from "@/app/actions/subscriptions";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader
} from "@/components/ui/card";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import {
  calculateMonthlyCost,
  calculateMyCost,
  convertToVnd,
  formatMoney,
  getUsdToVndRate
} from "@/lib/cost";
import { formatDateOnly } from "@/lib/date-only";
import { prisma } from "@/lib/prisma";
import { getReminderBucket, type ReminderBucket } from "@/lib/reminder";

export const dynamic = "force-dynamic";

type ReminderItem = {
  id: string;
  name: string;
  nextBillingDate: Date;
  currency: "VND" | "USD";
  myCost: Prisma.Decimal;
  reminderBucket: Exclude<ReminderBucket, "none">;
};

function reminderBadgeVariant(bucket: Exclude<ReminderBucket, "none">) {
  switch (bucket) {
    case "overdue":
      return "destructive" as const;
    case "today":
      return "warning" as const;
    case "tomorrow":
      return "success" as const;
  }
}

function reminderLabel(bucket: Exclude<ReminderBucket, "none">) {
  switch (bucket) {
    case "overdue":
      return "Overdue";
    case "today":
      return "Due Today";
    case "tomorrow":
      return "Due Tomorrow";
  }
}

function renderAmount(amount: Prisma.Decimal, currency: "VND" | "USD") {
  return `${formatMoney(amount, currency)} ${currency}`;
}

export default async function DashboardPage() {
  const subscriptions = await prisma.subscription.findMany({
    where: {
      archivedAt: null
    },
    orderBy: [{ nextBillingDate: "asc" }, { name: "asc" }]
  });

  const usdToVndRate = getUsdToVndRate();
  let monthlyTotalVnd = new Prisma.Decimal(0);

  const reminders: ReminderItem[] = [];

  const enrichedSubscriptions = subscriptions.map((subscription) => {
    const myCost = calculateMyCost(subscription);
    const monthlyCost = calculateMonthlyCost(subscription);
    const reminderBucket = getReminderBucket(subscription.nextBillingDate);

    monthlyTotalVnd = monthlyTotalVnd.plus(
      convertToVnd(monthlyCost, subscription.currency, usdToVndRate)
    );

    if (reminderBucket !== "none") {
      reminders.push({
        id: subscription.id,
        name: subscription.name,
        nextBillingDate: subscription.nextBillingDate,
        currency: subscription.currency,
        myCost,
        reminderBucket
      });
    }

    return {
      ...subscription,
      myCost,
      monthlyCost
    };
  });

  const reminderOrder: Exclude<ReminderBucket, "none">[] = [
    "overdue",
    "today",
    "tomorrow"
  ];
  reminders.sort(
    (a, b) =>
      reminderOrder.indexOf(a.reminderBucket) -
      reminderOrder.indexOf(b.reminderBucket)
  );

  return (
    <main className="container py-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Subtracker</h1>
          <p className="text-sm text-muted-foreground">
            Personal subscription tracker with my actual monthly cost.
          </p>
        </div>
        <Link href="/subscriptions/new" className={buttonVariants({ className: "gap-2" })}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add Subscription
        </Link>
      </header>

      <section className="mb-6">
        <Card className="glass-panel shadow-glow">
          <CardHeader>
            <h2 className="text-xl font-semibold leading-none tracking-tight">Monthly Summary</h2>
            <CardDescription>
              Monthly Total (All subscriptions converted to VND)
            </CardDescription>
            <p className="font-mono text-3xl text-neon-cyan">{renderAmount(monthlyTotalVnd, "VND")}</p>
            <p className="text-xs text-muted-foreground">
              USD conversion rate: 1 USD = {formatMoney(usdToVndRate, "VND")} VND
            </p>
          </CardHeader>
        </Card>
      </section>

      <section className="mb-6">
        <Card className="glass-panel">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <h2 className="text-xl font-semibold leading-none tracking-tight">Reminders</h2>
              <CardDescription>Overdue, today, and tomorrow billing alerts.</CardDescription>
            </div>
            <CalendarClock className="h-5 w-5 text-neon-cyan" />
          </CardHeader>
          <CardContent className="space-y-3">
            {reminders.length === 0 ? (
              <div className="rounded-md border border-border/60 bg-card/40 p-4 text-sm text-muted-foreground">
                No upcoming reminders in overdue/today/tomorrow buckets.
              </div>
            ) : (
              reminders.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 rounded-md border border-border/70 bg-card/40 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{item.name}</p>
                      <Badge variant={reminderBadgeVariant(item.reminderBucket)}>
                        {reminderLabel(item.reminderBucket)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatDateOnly(item.nextBillingDate)} -{" "}
                      {renderAmount(item.myCost, item.currency)}
                    </p>
                  </div>
                  <form action={markSubscriptionBilledAction}>
                    <input type="hidden" name="id" value={item.id} />
                    <FormSubmitButton pendingText="Marking..." variant="outline" size="sm">
                      Mark as billed
                    </FormSubmitButton>
                  </form>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="glass-panel">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <h2 className="text-xl font-semibold leading-none tracking-tight">
                Active Subscriptions
              </h2>
              <CardDescription>{enrichedSubscriptions.length} active records</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {enrichedSubscriptions.length === 0 ? (
              <div className="flex items-center gap-2 rounded-md border border-border/60 bg-card/40 p-4 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                No subscriptions yet. Add your first one to start tracking.
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {enrichedSubscriptions.map((subscription) => (
                  <article
                    key={subscription.id}
                    className="rounded-md border border-border/70 bg-card/40 p-4 transition focus-within:border-neon-cyan/60 focus-within:shadow-glow"
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold">{subscription.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Next bill: {formatDateOnly(subscription.nextBillingDate)}
                        </p>
                      </div>
                      <Link
                        href={`/subscriptions/${subscription.id}/edit`}
                        className={buttonVariants({ variant: "ghost", size: "sm" })}
                      >
                        Edit
                      </Link>
                    </div>

                    <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-md border border-border/60 bg-background/30 p-3">
                        <p className="text-muted-foreground">My cost / cycle</p>
                        <p className="font-mono font-medium">
                          {renderAmount(subscription.myCost, subscription.currency)}
                        </p>
                      </div>
                      <div className="rounded-md border border-border/60 bg-background/30 p-3">
                        <p className="text-muted-foreground">My monthly cost</p>
                        <p className="font-mono font-medium">
                          {renderAmount(subscription.monthlyCost, subscription.currency)}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <form action={markSubscriptionBilledAction}>
                        <input type="hidden" name="id" value={subscription.id} />
                        <FormSubmitButton pendingText="Marking..." size="sm" variant="outline">
                          Mark billed
                        </FormSubmitButton>
                      </form>
                      <form action={archiveSubscriptionAction}>
                        <input type="hidden" name="id" value={subscription.id} />
                        <FormSubmitButton pendingText="Archiving..." size="sm" variant="destructive">
                          Archive
                        </FormSubmitButton>
                      </form>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
