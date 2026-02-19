import { addMonths, format } from "date-fns";

const DAY_MS = 24 * 60 * 60 * 1000;
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

export function dateOnlyStringFromDb(date: Date): string {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  return `${year}-${pad(month)}-${pad(day)}`;
}

export function parseDateOnlyInput(input: string): Date {
  const [year, month, day] = input.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

export function isValidDateOnlyInput(input: string): boolean {
  if (!DATE_ONLY_PATTERN.test(input)) {
    return false;
  }
  return dateOnlyStringFromDb(parseDateOnlyInput(input)) === input;
}

export function formatDateOnly(date: Date): string {
  return format(parseDateOnlyInput(dateOnlyStringFromDb(date)), "dd MMM yyyy");
}

export function dateOnlyDiffFromToday(nextBillingDate: Date, now = new Date()): number {
  const target = parseDateOnlyInput(dateOnlyStringFromDb(nextBillingDate));
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.floor((target.getTime() - today) / DAY_MS);
}

export function addMonthsDateOnly(date: Date, monthDelta: number): Date {
  const normalized = parseDateOnlyInput(dateOnlyStringFromDb(date));
  return addMonths(normalized, monthDelta);
}
