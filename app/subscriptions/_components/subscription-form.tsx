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
      pendingText={mode === "create" ? "Đang tạo..." : "Đang lưu..."}
    >
      {mode === "create" ? "Tạo đăng ký" : "Lưu thay đổi"}
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

      <section className="clay-inset space-y-4 p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
          Thông tin cơ bản
        </h3>

        <div className="grid gap-2">
          <Label htmlFor="name">Tên dịch vụ</Label>
          <Input id="name" name="name" placeholder="Netflix" defaultValue={values.name} />
          <FieldError error={state.fieldErrors?.name} />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="totalAmount">Tổng tiền</Label>
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
            <Label htmlFor="currency">Đơn vị tiền tệ</Label>
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

      <section className="clay-inset space-y-4 p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
          Thiết lập chi phí
        </h3>

        <div className="grid gap-2">
          <Label htmlFor="costMode">Cách chia chi phí</Label>
          <Select
            id="costMode"
            name="costMode"
            defaultValue={values.costMode}
            onChange={(event) => setCostMode(event.target.value as CostMode)}
          >
            <option value="full">Toàn bộ - tôi trả hết</option>
            <option value="split">Chia đều - có người dùng chung</option>
            <option value="fixed">Cố định - phần tôi tự đặt</option>
          </Select>
          <FieldError error={state.fieldErrors?.costMode} />
        </div>

        {costMode === "split" ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="splitTotalUsers">Tổng số người dùng chung</Label>
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
              <Label htmlFor="myShare">Số phần của tôi</Label>
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
            <Label htmlFor="fixedAmount">Số tiền cố định của tôi</Label>
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

      <section className="clay-inset space-y-4 p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
          Chu kỳ thanh toán
        </h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="billingType">Loại chu kỳ</Label>
            <Select id="billingType" name="billingType" defaultValue={values.billingType}>
              <option value="monthly">Theo tháng</option>
              <option value="yearly">Theo năm</option>
            </Select>
            <FieldError error={state.fieldErrors?.billingType} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="billingInterval">Số chu kỳ lặp</Label>
            <Input
              id="billingInterval"
              name="billingInterval"
              type="number"
              min="1"
              step="1"
              defaultValue={values.billingInterval}
            />
            <p className="text-xs text-muted-foreground">
              Ví dụ: 2 + Theo tháng = thanh toán mỗi 2 tháng.
            </p>
            <FieldError error={state.fieldErrors?.billingInterval} />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="nextBillingDate">Ngày thanh toán kế tiếp</Label>
          <Input
            id="nextBillingDate"
            name="nextBillingDate"
            type="date"
            defaultValue={values.nextBillingDate}
          />
          <FieldError error={state.fieldErrors?.nextBillingDate} />
        </div>
      </section>

      <section className="clay-inset space-y-4 p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
          Ghi chú
        </h3>
        <div className="grid gap-2">
          <Label htmlFor="note">Ghi chú (không bắt buộc)</Label>
          <Textarea
            id="note"
            name="note"
            rows={4}
            placeholder="Ví dụ: Gói gia đình chia với anh chị em"
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
