"use client";

import { useActionState, useMemo, useState } from "react";

import type { SubscriptionFormState } from "@/app/actions/subscriptions";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type FormMode = "create" | "edit";
type CostMode = "full" | "split" | "fixed";
type Currency = "VND" | "USD";
type BillingType = "monthly" | "yearly";

type SubscriptionFormValues = {
  id?: string;
  name: string;
  totalAmount: string;
  currency: Currency;
  costMode: CostMode;
  splitTotalUsers: string;
  myShare: string;
  fixedAmount: string;
  billingType: BillingType;
  billingInterval: string;
  nextBillingDate: string;
  note: string;
};

const initialFormState: SubscriptionFormState = {
  message: undefined,
  fieldErrors: {}
};

const defaultValues: SubscriptionFormValues = {
  name: "",
  totalAmount: "",
  currency: "VND",
  costMode: "full",
  splitTotalUsers: "",
  myShare: "",
  fixedAmount: "",
  billingType: "monthly",
  billingInterval: "1",
  nextBillingDate: "",
  note: ""
};

function SubmitButton({ mode }: { mode: FormMode }) {
  return (
    <FormSubmitButton
      type="submit"
      className="w-full sm:w-auto"
      pendingText={mode === "create" ? "Creating..." : "Saving..."}
    >
      {mode === "create" ? "Create Subscription" : "Save Changes"}
    </FormSubmitButton>
  );
}

function FieldError({ error }: { error?: string[] }) {
  if (!error?.length) {
    return null;
  }
  return <p className="text-xs font-medium text-red-600">{error[0]}</p>;
}

type Props = {
  mode: FormMode;
  formAction: (
    state: SubscriptionFormState,
    payload: FormData
  ) => Promise<SubscriptionFormState>;
  initialValues?: SubscriptionFormValues;
};

export function SubscriptionForm({ mode, formAction, initialValues }: Props) {
  const values = useMemo(
    () => ({
      ...defaultValues,
      ...initialValues
    }),
    [initialValues]
  );
  const [state, action] = useActionState(formAction, initialFormState);
  const [costMode, setCostMode] = useState<CostMode>(values.costMode);
  const [currency, setCurrency] = useState<Currency>(values.currency);

  const amountStep = currency === "USD" ? "0.01" : "1";

  return (
    <form action={action} className="space-y-5">
      {mode === "edit" && values.id ? <input type="hidden" name="id" value={values.id} /> : null}

      <section className="clay-inset space-y-4 p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
          Basic Information
        </h3>

        <div className="grid gap-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" placeholder="Netflix" defaultValue={values.name} />
          <FieldError error={state.fieldErrors?.name} />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="totalAmount">Total Amount</Label>
            <Input
              id="totalAmount"
              name="totalAmount"
              type="number"
              min="0"
              step={amountStep}
              defaultValue={values.totalAmount}
            />
            <FieldError error={state.fieldErrors?.totalAmount} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="currency">Currency</Label>
            <Select
              id="currency"
              name="currency"
              defaultValue={values.currency}
              onChange={(event) => setCurrency(event.target.value as Currency)}
            >
              <option value="VND">VND</option>
              <option value="USD">USD</option>
            </Select>
            <FieldError error={state.fieldErrors?.currency} />
          </div>
        </div>
      </section>

      <section className="clay-inset space-y-4 p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
          Cost Setup
        </h3>

        <div className="grid gap-2">
          <Label htmlFor="costMode">Cost Mode</Label>
          <Select
            id="costMode"
            name="costMode"
            defaultValue={values.costMode}
            onChange={(event) => setCostMode(event.target.value as CostMode)}
          >
            <option value="full">Full - I pay all</option>
            <option value="split">Split - shared with others</option>
            <option value="fixed">Fixed - my fixed amount</option>
          </Select>
          <FieldError error={state.fieldErrors?.costMode} />
        </div>

        {costMode === "split" ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="splitTotalUsers">Split Total Users</Label>
              <Input
                id="splitTotalUsers"
                name="splitTotalUsers"
                type="number"
                min="1"
                step="1"
                defaultValue={values.splitTotalUsers}
              />
              <FieldError error={state.fieldErrors?.splitTotalUsers} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="myShare">My Share</Label>
              <Input
                id="myShare"
                name="myShare"
                type="number"
                min="1"
                step="1"
                defaultValue={values.myShare}
              />
              <FieldError error={state.fieldErrors?.myShare} />
            </div>
          </div>
        ) : null}

        {costMode === "fixed" ? (
          <div className="grid gap-2">
            <Label htmlFor="fixedAmount">Fixed Amount</Label>
            <Input
              id="fixedAmount"
              name="fixedAmount"
              type="number"
              min="0"
              step={amountStep}
              defaultValue={values.fixedAmount}
            />
            <FieldError error={state.fieldErrors?.fixedAmount} />
          </div>
        ) : null}
      </section>

      <section className="clay-inset space-y-4 p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
          Billing Schedule
        </h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="billingType">Billing Type</Label>
            <Select id="billingType" name="billingType" defaultValue={values.billingType}>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </Select>
            <FieldError error={state.fieldErrors?.billingType} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="billingInterval">Billing Interval</Label>
            <Input
              id="billingInterval"
              name="billingInterval"
              type="number"
              min="1"
              step="1"
              defaultValue={values.billingInterval}
            />
            <p className="text-xs text-muted-foreground">
              Example: 2 + Monthly = billed every 2 months.
            </p>
            <FieldError error={state.fieldErrors?.billingInterval} />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="nextBillingDate">Next Billing Date</Label>
          <Input
            id="nextBillingDate"
            name="nextBillingDate"
            type="date"
            defaultValue={values.nextBillingDate}
          />
          <FieldError error={state.fieldErrors?.nextBillingDate} />
        </div>
      </section>

      <section className="clay-inset space-y-4 p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
          Notes
        </h3>
        <div className="grid gap-2">
          <Label htmlFor="note">Note (optional)</Label>
          <Textarea
            id="note"
            name="note"
            rows={4}
            placeholder="Family plan with siblings"
            defaultValue={values.note}
          />
          <FieldError error={state.fieldErrors?.note} />
        </div>
      </section>

      {state.message ? <p className="text-sm font-medium text-red-600">{state.message}</p> : null}

      <SubmitButton mode={mode} />
    </form>
  );
}
