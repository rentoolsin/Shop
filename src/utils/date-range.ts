/**
 * Shared local-business-date helpers. Anything that needs "today" or a
 * calendar range as an ISO date string (YYYY-MM-DD) must go through here —
 * do not call `date.toISOString().slice(0, 10)` directly. `toISOString()`
 * converts to UTC first, so for any timezone ahead of UTC (e.g. IST,
 * UTC+5:30) a local midnight can serialize as the *previous* day, silently
 * shifting "today"/"this month" by a day. Every function below reads the
 * browser's local Y/M/D components instead.
 */

/** Formats a Date using its LOCAL year/month/day — never UTC. */
export function toLocalISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function todayISO(now: Date = new Date()): string {
  return toLocalISODate(now);
}

export function startOfWeekISO(now: Date = new Date()): string {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  d.setDate(d.getDate() - d.getDay()); // Sunday as the first day of the week
  return toLocalISODate(d);
}

export function startOfMonthISO(now: Date = new Date()): string {
  return toLocalISODate(new Date(now.getFullYear(), now.getMonth(), 1));
}

export function startOfLastMonthISO(now: Date = new Date()): string {
  return toLocalISODate(new Date(now.getFullYear(), now.getMonth() - 1, 1));
}

export function endOfLastMonthISO(now: Date = new Date()): string {
  // Day 0 of the current month = last day of the previous month.
  return toLocalISODate(new Date(now.getFullYear(), now.getMonth(), 0));
}

export interface DateRange {
  from: string;
  to: string;
}

export type DateRangePresetKey = "today" | "this_week" | "this_month" | "last_month" | "custom";

export const DATE_RANGE_PRESET_LABEL: Record<DateRangePresetKey, string> = {
  today: "Today",
  this_week: "This week",
  this_month: "This month",
  last_month: "Last month",
  custom: "Custom range",
};

/** Every preset except "custom" resolves to a concrete {from, to}. */
export function resolvePresetRange(
  preset: Exclude<DateRangePresetKey, "custom">,
  now: Date = new Date(),
): DateRange {
  const today = todayISO(now);
  switch (preset) {
    case "today":
      return { from: today, to: today };
    case "this_week":
      return { from: startOfWeekISO(now), to: today };
    case "this_month":
      return { from: startOfMonthISO(now), to: today };
    case "last_month":
      return { from: startOfLastMonthISO(now), to: endOfLastMonthISO(now) };
  }
}

/** Inclusive calendar-day count between two local ISO dates. */
export function daysBetweenInclusive(fromISO: string, toISO: string): number {
  const start = new Date(fromISO + "T00:00:00");
  const end = new Date(toISO + "T00:00:00");
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((end.getTime() - start.getTime()) / msPerDay) + 1;
}

export function isValidRange(range: DateRange): boolean {
  return Boolean(range.from) && Boolean(range.to) && range.from <= range.to;
}
