import Link from "next/link";

import { createSubscriptionAction } from "@/app/actions/subscriptions";
import { SubscriptionForm } from "@/app/subscriptions/_components/subscription-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewSubscriptionPage() {
  return (
    <main className="container py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Add Subscription</h1>
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          Back to dashboard
        </Link>
      </div>

      <Card className="glass-panel">
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
