import { formatDateOptionLabel, formatDateSlash, getWeekday, toIsoDate } from "@/libs/utils/date.util";

import type { Entry, TimesheetDoc } from "@/types/timesheet.type";

import type { MergeOption, ReviewDay, ReviewItem, ReviewWeek } from "./ImportReview.type";

/**
 * Monday of the week of an ISO date (timezone-independent).
 * @param {string} isoDate - ISO date
 * @returns {string} - ISO date of that Monday
 */
export const getWeekStart = (isoDate: string): string => {
  const [year, month, day] = isoDate.split("-").map(Number);
  const offset = (getWeekday(isoDate) + 6) % 7;
  const monday = new Date(Date.UTC(year, month - 1, day - offset));

  return toIsoDate(monday.getUTCFullYear(), monday.getUTCMonth() + 1, monday.getUTCDate());
};

/**
 * Add days to an ISO date.
 * @param {string} isoDate - ISO date
 * @param {number} days - Days to add
 * @returns {string} - ISO date
 */
export const addDays = (isoDate: string, days: number): string => {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));

  return toIsoDate(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
};

/**
 * One review item: source, `ticket · branch · repo`, real-hours hint and the rows it can merge into.
 * @param {Entry} entry - Automatic entry
 * @param {Entry[]} sameDate - Every entry of the same date
 * @returns {ReviewItem} - Item
 */
export const buildReviewItem = (entry: Entry, sameDate: Entry[]): ReviewItem => {
  const refs = entry.refs;
  const mergeOptions: MergeOption[] = sameDate
    .filter((other) => other.id !== entry.id)
    .map((other) => ({ value: other.id, label: other.task || "(tanpa task)" }));

  return {
    entry,
    source: entry.source,
    meta: [refs?.ticket, refs?.branch, refs?.repo].filter(Boolean).join(" · "),
    hintText: refs?.hint ? `Aktivitas terdeteksi ${refs.hint.first}–${refs.hint.last}` : null,
    mergeOptions,
  };
};

/**
 * Automatic entries waiting for review, grouped by week (Monday first) and date, ascending.
 * @param {TimesheetDoc} doc - Document
 * @returns {ReviewWeek[]} - Weeks
 */
export const buildReviewWeeks = (doc: TimesheetDoc): ReviewWeek[] => {
  const pending = doc.entries.filter((entry) => !entry.reviewed).sort((a, b) => a.date.localeCompare(b.date));
  const weeks = new Map<string, ReviewWeek>();

  pending.forEach((entry) => {
    const key = getWeekStart(entry.date);
    const week = weeks.get(key) ?? {
      key,
      label: `Minggu ${formatDateSlash(key)} – ${formatDateSlash(addDays(key, 6))}`,
      entryIds: [],
      days: [],
    };
    const day: ReviewDay = week.days.find((item) => item.date === entry.date) ?? { date: entry.date, label: formatDateOptionLabel(entry.date), items: [] };

    if (!week.days.includes(day)) {
      week.days.push(day);
    }

    day.items.push(buildReviewItem(entry, doc.entries.filter((other) => other.date === entry.date)));
    week.entryIds.push(entry.id);
    weeks.set(key, week);
  });

  return [...weeks.values()];
};

/**
 * Shell-safe double-quoted argument.
 * @param {string} value - Raw value
 * @returns {string} - Quoted value
 */
const _quote = (value: string): string => `"${value.replace(/(["\\$`])/g, "\\$1")}"`;

/**
 * The CLI command that imports the worklog into this document (the browser cannot run it).
 * @param {string} fileName - Document file name
 * @param {TimesheetDoc["period"]} period - Document period
 * @returns {string} - Command line
 */
export const buildImportCommand = (fileName: string, period: TimesheetDoc["period"]): string => {
  return `timesheet import --doc ${_quote(fileName)} --month ${period.year}-${String(period.month).padStart(2, "0")}`;
};
