import { dateOnlyDiffFromToday } from "@/lib/date-only";

export type ReminderBucket = "overdue" | "today" | "tomorrow" | "none";

export function getReminderBucket(
  nextBillingDate: Date,
  now: Date = new Date()
): ReminderBucket {
  // Compare by date-only values so reminders stay stable across timezones.
  const dayDiff = dateOnlyDiffFromToday(nextBillingDate, now);

  if (dayDiff < 0) {
    return "overdue";
  }

  if (dayDiff === 0) {
    return "today";
  }

  if (dayDiff === 1) {
    return "tomorrow";
  }

  return "none";
}
