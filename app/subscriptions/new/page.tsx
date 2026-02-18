import Link from "next/link";

import { createSubscriptionAction } from "@/app/actions/subscriptions";
import { SubscriptionForm } from "@/app/subscriptions/_components/subscription-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const backLinkClass =
  "clay-action-soft px-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default function NewSubscriptionPage() {
  return (
    <main className="container py-8 md:py-10">
      <div className="clay-panel mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-800">
          Thêm đăng ký
        </h1>
        <Link href="/" className={backLinkClass}>
          Quay lại dashboard
        </Link>
      </div>

      <Card className="clay-elevated">
        <CardHeader>
          <CardTitle className="text-xl text-slate-800">Thông tin đăng ký mới</CardTitle>
        </CardHeader>
        <CardContent>
          <SubscriptionForm mode="create" formAction={createSubscriptionAction} />
        </CardContent>
      </Card>
    </main>
  );
}
