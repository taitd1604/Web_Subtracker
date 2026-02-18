import { Prisma } from "@prisma/client";
import { AlertCircle, Clock3, Plus } from "lucide-react";
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
  "clay-action-primary gap-2 px-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const ghostLinkButtonSmClass =
  "clay-action-soft px-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const logoPalettes = [
  { from: "#DBEAFE", to: "#BFDBFE", text: "#1E3A8A" },
  { from: "#DCFCE7", to: "#BBF7D0", text: "#14532D" },
  { from: "#D1FAE5", to: "#99F6E4", text: "#115E59" },
  { from: "#E0F2FE", to: "#BAE6FD", text: "#0C4A6E" },
  { from: "#CCFBF1", to: "#99F6E4", text: "#134E4A" },
  { from: "#ECFEFF", to: "#A5F3FC", text: "#164E63" },
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
      return "Quá hạn";
    case "today":
      return "Hôm nay";
    case "tomorrow":
      return "Ngày mai";
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
    return interval === 1 ? "Mỗi tháng" : `Mỗi ${interval} tháng`;
  }

  return interval === 1 ? "Mỗi năm" : `Mỗi ${interval} năm`;
}

function formatCostMode(mode: "full" | "split" | "fixed") {
  switch (mode) {
    case "full":
      return "toàn bộ";
    case "split":
      return "chia sẻ";
    case "fixed":
      return "cố định";
  }
}

function currencyAccentClass(currency: "VND" | "USD") {
  return currency === "VND"
    ? "from-blue-400/70 via-blue-300/65 to-cyan-300/60"
    : "from-emerald-400/70 via-teal-300/65 to-cyan-300/60";
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

  const subscriptionCards = enrichedSubscriptions.map((subscription) => (
    <article key={subscription.id} className="clay-panel space-y-4 p-5">
      <div
        className={`h-1.5 w-full rounded-full bg-gradient-to-r ${currencyAccentClass(subscription.currency)}`}
        aria-hidden="true"
      />
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="clay-logo-chip flex h-12 w-12 items-center justify-center text-sm font-bold"
            style={getLogoStyle(subscription.name)}
            aria-hidden="true"
          >
            {getLogoMonogram(subscription.name)}
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-800">{subscription.name}</h3>
            <p className="text-sm text-slate-600">
              Kỳ tới: {formatDateOnly(subscription.nextBillingDate)}
            </p>
          </div>
        </div>
        <Badge variant="outline">{subscription.currency}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="clay-inset p-3">
          <p className="text-slate-600">Chi phí / chu kỳ</p>
          <p className="mt-1 font-mono text-[15px] font-semibold text-slate-800">
            {renderAmount(subscription.myCost, subscription.currency)}
          </p>
        </div>
        <div className="clay-inset p-3">
          <p className="text-slate-600">Chi phí / tháng</p>
          <p className="mt-1 font-mono text-[15px] font-semibold text-blue-700">
            {renderAmount(subscription.monthlyCost, subscription.currency)}
          </p>
        </div>
      </div>

      <div className="clay-inset flex items-center justify-between p-3 text-xs text-slate-600">
        <span className="inline-flex items-center gap-1">
          <Clock3 className="h-3.5 w-3.5" />
          {formatBillingFrequency(subscription.billingType, subscription.billingInterval)}
        </span>
        <span className="capitalize">Chế độ {formatCostMode(subscription.costMode)}</span>
      </div>

      {subscription.note ? (
        <p className="rounded-xl bg-white/55 px-3 py-2 text-sm text-slate-700">
          {subscription.note}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Link href={`/subscriptions/${subscription.id}/edit`} className={ghostLinkButtonSmClass}>
          Chỉnh sửa
        </Link>
        <form action={markSubscriptionBilledAction}>
          <input type="hidden" name="id" value={subscription.id} />
          <FormSubmitButton pendingText="Đang cập nhật..." size="sm" variant="outline">
            Đã thanh toán
          </FormSubmitButton>
        </form>
        <form action={archiveSubscriptionAction}>
          <input type="hidden" name="id" value={subscription.id} />
          <FormSubmitButton pendingText="Đang lưu..." size="sm" variant="destructive">
            Lưu trữ
          </FormSubmitButton>
        </form>
      </div>
    </article>
  ));

  return (
    <main className="container py-8 md:py-10">
      <header className="clay-panel clay-tone-hero mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-800">Subtracker</h1>
          <p className="text-sm text-slate-600">
            Bảng điều khiển đăng ký cá nhân theo phong cách claymorphism.
          </p>
        </div>
        <Link href="/subscriptions/new" className={primaryLinkButtonClass}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Thêm đăng ký
        </Link>
      </header>

      <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="clay-elevated clay-tone-kpi-1 p-5">
          <CardDescription className="text-xs font-medium uppercase tracking-wide text-slate-600">
            Tổng chi phí tháng
          </CardDescription>
          <CardTitle className="mt-1 text-2xl text-blue-700">
            {renderAmount(monthlyTotalVnd, "VND")}
          </CardTitle>
          <p className="mt-2 text-xs text-slate-600">
            Tỷ giá: 1 USD = {formatMoney(usdToVndRate, "VND")} VND
          </p>
        </Card>
        <Card className="clay-elevated clay-tone-kpi-2 p-5">
          <CardDescription className="text-xs font-medium uppercase tracking-wide text-slate-600">
            Quá hạn
          </CardDescription>
          <CardTitle className="mt-1 text-2xl text-red-700">{overdueCount}</CardTitle>
          <p className="mt-2 text-xs text-slate-600">Các khoản cần xử lý ngay</p>
        </Card>
        <Card className="clay-elevated clay-tone-kpi-3 p-5">
          <CardDescription className="text-xs font-medium uppercase tracking-wide text-slate-600">
            Đến hạn hôm nay
          </CardDescription>
          <CardTitle className="mt-1 text-2xl text-amber-700">{dueTodayCount}</CardTitle>
          <p className="mt-2 text-xs text-slate-600">Cần thanh toán trong ngày</p>
        </Card>
        <Card className="clay-elevated clay-tone-kpi-4 p-5">
          <CardDescription className="text-xs font-medium uppercase tracking-wide text-slate-600">
            7 ngày tới
          </CardDescription>
          <CardTitle className="mt-1 text-2xl text-emerald-700">{upcomingCount}</CardTitle>
          <p className="mt-2 text-xs text-slate-600">Chuẩn bị ngân sách sớm</p>
        </Card>
      </section>

      <section className="mb-6">
        <Card className="clay-elevated clay-tone-reminder">
          <CardHeader>
            <h2 className="text-2xl font-semibold leading-none tracking-tight text-slate-800">
              Nhắc hạn
            </h2>
            <CardDescription className="text-slate-600">
              Danh sách nhắc hạn gần nhất.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {reminders.length === 0 ? (
              <div className="clay-inset flex items-center justify-between gap-3 p-4 text-sm text-slate-600">
                <span>Không có nhắc hạn trong nhóm quá hạn / hôm nay / ngày mai.</span>
                <Link href="/subscriptions/new" className={ghostLinkButtonSmClass}>
                  Thêm đăng ký
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
                      className="clay-logo-chip flex h-11 w-11 items-center justify-center text-xs font-bold"
                      style={getLogoStyle(item.name)}
                      aria-hidden="true"
                    >
                      {getLogoMonogram(item.name)}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-800">{item.name}</p>
                        <Badge variant={reminderBadgeVariant(item.reminderBucket)}>
                          {reminderLabel(item.reminderBucket)}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600">
                        {formatDateOnly(item.nextBillingDate)} - {renderAmount(item.myCost, item.currency)}
                      </p>
                    </div>
                  </div>
                  <form action={markSubscriptionBilledAction}>
                    <input type="hidden" name="id" value={item.id} />
                    <FormSubmitButton pendingText="Đang cập nhật..." variant="outline" size="sm">
                      Đã thanh toán
                    </FormSubmitButton>
                  </form>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="clay-elevated clay-tone-subscription">
          <CardHeader>
            <h2 className="text-2xl font-semibold leading-none tracking-tight text-slate-800">
              Các gói đăng ký
            </h2>
            <CardDescription className="text-slate-600">
              Mỗi đăng ký hiển thị dưới dạng thẻ riêng có nhận diện monogram.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {enrichedSubscriptions.length === 0 ? (
              <div className="clay-inset flex items-center gap-2 p-4 text-sm text-slate-600">
                <AlertCircle className="h-4 w-4" />
                Chưa có đăng ký nào. Hãy thêm gói đầu tiên để bắt đầu theo dõi.
              </div>
            ) : enrichedSubscriptions.length === 1 ? (
              <div className="mx-auto max-w-xl">{subscriptionCards[0]}</div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">{subscriptionCards}</div>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
