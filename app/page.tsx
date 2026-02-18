import { Prisma } from "@prisma/client";
import {
  AlertCircle,
  CalendarClock,
  Clock3,
  Plus,
  TrendingUp
} from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";

import {
  archiveSubscriptionAction,
  markSubscriptionBilledAction
} from "@/app/actions/subscriptions";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import {
  calculateMonthlyCost,
  calculateMyCost,
  convertToVnd,
  formatMoney,
  getUsdToVndRate
} from "@/lib/cost";
import { dateOnlyDiffFromToday, formatDateOnly } from "@/lib/date-only";
import { prisma } from "@/lib/prisma";
import { getReminderBucket, type ReminderBucket } from "@/lib/reminder";

export const dynamic = "force-dynamic";

const primaryLinkButtonClass =
  "inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-blue-300/80 bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[6px_6px_14px_rgba(59,130,246,0.28),-4px_-4px_12px_rgba(255,255,255,0.85)] transition-transform duration-150 hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:translate-y-px";

const ghostLinkButtonSmClass =
  "inline-flex h-10 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-slate-100/80 px-3.5 text-sm font-semibold text-foreground shadow-[4px_4px_10px_rgba(148,163,184,0.24),-3px_-3px_8px_rgba(255,255,255,0.9)] transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const logoPalettes = [
  { from: "#DBEAFE", to: "#BFDBFE", text: "#1E3A8A" },
  { from: "#DCFCE7", to: "#BBF7D0", text: "#14532D" },
  { from: "#FCE7F3", to: "#FBCFE8", text: "#831843" },
  { from: "#FFEDD5", to: "#FED7AA", text: "#7C2D12" },
  { from: "#E0E7FF", to: "#C7D2FE", text: "#312E81" }
];

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

function getLogoMonogram(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "SB";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function getLogoStyle(name: string): CSSProperties {
  let hash = 0;
  for (const char of name) {
    hash = (hash << 5) - hash + char.charCodeAt(0);
    hash |= 0;
  }

  const palette = logoPalettes[Math.abs(hash) % logoPalettes.length];

  return {
    background: `linear-gradient(145deg, ${palette.from}, ${palette.to})`,
    color: palette.text
  };
}

function formatBillingFrequency(type: "monthly" | "yearly", interval: number) {
  if (type === "monthly") {
    return interval === 1 ? "Every month" : `Every ${interval} months`;
  }

  return interval === 1 ? "Every year" : `Every ${interval} years`;
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
  let overdueCount = 0;
  let dueTodayCount = 0;
  let upcomingCount = 0;

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

    if (reminderBucket === "overdue") {
      overdueCount += 1;
    }

    if (reminderBucket === "today") {
      dueTodayCount += 1;
    }

    const diffInDays = dateOnlyDiffFromToday(subscription.nextBillingDate);

    if (diffInDays >= 0 && diffInDays <= 7) {
      upcomingCount += 1;
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
    <main className="container py-8 md:py-10">
      <header className="clay-panel mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Subtracker</h1>
          <p className="text-sm text-muted-foreground">
            Claymorphism dashboard cho toàn bộ đăng ký của bạn.
          </p>
        </div>
        <Link href="/subscriptions/new" className={primaryLinkButtonClass}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add Subscription
        </Link>
      </header>

      <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-5">
          <CardDescription className="text-xs uppercase tracking-wide">
            Monthly Total
          </CardDescription>
          <CardTitle className="mt-1 text-2xl text-blue-700">
            {renderAmount(monthlyTotalVnd, "VND")}
          </CardTitle>
          <p className="mt-2 text-xs text-muted-foreground">
            USD rate: 1 USD = {formatMoney(usdToVndRate, "VND")} VND
          </p>
        </Card>
        <Card className="p-5">
          <CardDescription className="text-xs uppercase tracking-wide">
            Overdue
          </CardDescription>
          <CardTitle className="mt-1 text-2xl text-red-700">{overdueCount}</CardTitle>
          <p className="mt-2 text-xs text-muted-foreground">Thanh toán quá hạn</p>
        </Card>
        <Card className="p-5">
          <CardDescription className="text-xs uppercase tracking-wide">
            Due Today
          </CardDescription>
          <CardTitle className="mt-1 text-2xl text-amber-700">{dueTodayCount}</CardTitle>
          <p className="mt-2 text-xs text-muted-foreground">Cần thanh toán hôm nay</p>
        </Card>
        <Card className="p-5">
          <CardDescription className="text-xs uppercase tracking-wide">
            Upcoming 7 Days
          </CardDescription>
          <CardTitle className="mt-1 text-2xl text-emerald-700">{upcomingCount}</CardTitle>
          <p className="mt-2 text-xs text-muted-foreground">Sắp đến hạn trong 7 ngày</p>
        </Card>
      </section>

      <section className="mb-6">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <h2 className="text-xl font-semibold leading-none tracking-tight">
                Reminders
              </h2>
              <CardDescription>Danh sách nhắc hạn gần nhất.</CardDescription>
            </div>
            <CalendarClock className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent className="space-y-3">
            {reminders.length === 0 ? (
              <div className="clay-inset flex items-center justify-between gap-3 p-4 text-sm text-muted-foreground">
                <span>Không có nhắc hạn trong overdue/today/tomorrow.</span>
                <Link href="/subscriptions/new" className={ghostLinkButtonSmClass}>
                  Add one
                </Link>
              </div>
            ) : (
              reminders.map((item) => (
                <div
                  key={item.id}
                  className="clay-inset flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/70 text-xs font-bold"
                      style={getLogoStyle(item.name)}
                      aria-hidden="true"
                    >
                      {getLogoMonogram(item.name)}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{item.name}</p>
                        <Badge variant={reminderBadgeVariant(item.reminderBucket)}>
                          {reminderLabel(item.reminderBucket)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDateOnly(item.nextBillingDate)} - {renderAmount(item.myCost, item.currency)}
                      </p>
                    </div>
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
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <h2 className="text-xl font-semibold leading-none tracking-tight">
                Subscription Cards
              </h2>
              <CardDescription>
                Mỗi đăng ký là một thẻ riêng có logo nhận diện.
              </CardDescription>
            </div>
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            {enrichedSubscriptions.length === 0 ? (
              <div className="clay-inset flex items-center gap-2 p-4 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                No subscriptions yet. Add your first one to start tracking.
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
                {enrichedSubscriptions.map((subscription) => (
                  <article key={subscription.id} className="clay-panel space-y-4 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/70 text-sm font-bold"
                          style={getLogoStyle(subscription.name)}
                          aria-hidden="true"
                        >
                          {getLogoMonogram(subscription.name)}
                        </div>
                        <div>
                          <h3 className="font-semibold">{subscription.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Next bill: {formatDateOnly(subscription.nextBillingDate)}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">{subscription.currency}</Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="clay-inset p-3">
                        <p className="text-muted-foreground">My cost / cycle</p>
                        <p className="mt-1 font-mono text-[15px] font-semibold">
                          {renderAmount(subscription.myCost, subscription.currency)}
                        </p>
                      </div>
                      <div className="clay-inset p-3">
                        <p className="text-muted-foreground">My monthly cost</p>
                        <p className="mt-1 font-mono text-[15px] font-semibold text-blue-700">
                          {renderAmount(subscription.monthlyCost, subscription.currency)}
                        </p>
                      </div>
                    </div>

                    <div className="clay-inset flex items-center justify-between p-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Clock3 className="h-3.5 w-3.5" />
                        {formatBillingFrequency(
                          subscription.billingType,
                          subscription.billingInterval
                        )}
                      </span>
                      <span className="capitalize">{subscription.costMode} mode</span>
                    </div>

                    {subscription.note ? (
                      <p className="rounded-xl bg-white/50 px-3 py-2 text-sm text-slate-600">
                        {subscription.note}
                      </p>
                    ) : null}

                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/subscriptions/${subscription.id}/edit`}
                        className={ghostLinkButtonSmClass}
                      >
                        Edit
                      </Link>
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
