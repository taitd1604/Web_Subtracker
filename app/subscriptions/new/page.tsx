import Link from "next/link";

import { createSubscriptionAction } from "@/app/actions/subscriptions";
import { SubscriptionForm } from "@/app/subscriptions/_components/subscription-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const backLinkClass =
  "inline-flex h-10 cursor-pointer items-center rounded-xl border border-slate-300 bg-slate-100/70 px-3.5 text-sm font-semibold text-slate-700 shadow-[4px_4px_10px_rgba(148,163,184,0.2),-3px_-3px_8px_rgba(255,255,255,0.85)] transition-colors hover:bg-slate-100";

export default function NewSubscriptionPage() {
  return (
    <main className="container py-8 md:py-10">
      <div className="clay-panel mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Add Subscription</h1>
        <Link href="/" className={backLinkClass}>
          Back to dashboard
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">New subscription</CardTitle>
        </CardHeader>
        <CardContent>
          <SubscriptionForm mode="create" formAction={createSubscriptionAction} />
        </CardContent>
      </Card>
    </main>
  );
}
