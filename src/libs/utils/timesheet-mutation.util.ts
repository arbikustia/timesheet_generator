import type { Entry, Period, TimesheetDoc } from "@/types/timesheet.type";

import { getDayOfMonth, getDaysInMonth, getLastWeekday, getNextPeriod, isInPeriod, toIsoDate } from "./date.util";

/**
 * Create a unique id for entries and images.
 * @returns {string} - Random UUID
 */
export const createId = (): string => {
  return crypto.randomUUID();
};

/**
 * Insert an entry after the last entry whose date is on or before its date, keeping the list chronological.
 * @param {Entry[]} entries - Current entries (not mutated)
 * @param {Entry} entry - Entry to insert
 * @returns {Entry[]} - New list
 */
export const insertEntrySorted = (entries: Entry[], entry: Entry): Entry[] => {
  const after = entries.findLastIndex((item) => item.date <= entry.date);

  return [...entries.slice(0, after + 1), entry, ...entries.slice(after + 1)];
};

/**
 * Move one list item to another index.
 * @param {T[]} items - List (not mutated)
 * @param {number} fromIndex - Current index
 * @param {number} toIndex - Target index
 * @returns {T[]} - New list; unchanged copy when an index is out of range
 */
export const moveItem = <T>(items: T[], fromIndex: number, toIndex: number): T[] => {
  const isOutOfRange = [fromIndex, toIndex].some((index) => index < 0 || index >= items.length);

  if (isOutOfRange || fromIndex === toIndex) {
    return [...items];
  }

  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);

  next.splice(toIndex, 0, moved);

  return next;
};

/**
 * Re-date an ISO date to the same day of another period.
 * @param {string} isoDate - ISO date
 * @param {Period} period - Target period
 * @returns {string | null} - New ISO date, or null when that day does not exist in the target month
 */
export const _shiftDate = (isoDate: string, period: Period): string | null => {
  const day = getDayOfMonth(isoDate);

  return day > getDaysInMonth(period) ? null : toIsoDate(period.year, period.month, day);
};

/**
 * Re-key a date-keyed record to another period, dropping days that do not exist there.
 * @param {Record<string, V>} record - Date-keyed record
 * @param {Period} period - Target period
 * @returns {Record<string, V>} - Re-keyed record
 */
const _shiftRecord = <V>(record: Record<string, V>, period: Period): Record<string, V> => {
  return Object.fromEntries(
    Object.entries(record).flatMap(([isoDate, value]) => {
      const shifted = _shiftDate(isoDate, period);

      return shifted ? [[shifted, value]] : [];
    }),
  );
};

/**
 * Move every entry, evidence and day marking to the same day of another period.
 * Days missing in the target month (e.g. 31st) are dropped.
 * @param {TimesheetDoc} doc - Document
 * @param {Period} period - Target period
 * @returns {TimesheetDoc} - Re-dated document with the default signature date of the new period
 */
export const shiftDocToPeriod = (doc: TimesheetDoc, period: Period): TimesheetDoc => {
  const entries = doc.entries.flatMap((entry) => {
    const shifted = _shiftDate(entry.date, period);

    return shifted ? [{ ...entry, date: shifted }] : [];
  });

  return {
    ...doc,
    period,
    profile: { ...doc.profile, signDate: getLastWeekday(period) },
    entries,
    evidence: _shiftRecord(doc.evidence, period),
    dayOverrides: _shiftRecord(doc.dayOverrides, period),
  };
};

/**
 * Switch to a period with empty entries, evidence and day markings; profile and automation are kept.
 * @param {TimesheetDoc} doc - Document
 * @param {Period} period - Target period
 * @returns {TimesheetDoc} - Fresh document for the period
 */
export const resetDocToPeriod = (doc: TimesheetDoc, period: Period): TimesheetDoc => {
  return {
    ...doc,
    period,
    profile: { ...doc.profile, signDate: getLastWeekday(period) },
    entries: [],
    evidence: {},
    dayOverrides: {},
  };
};

/**
 * "Mulai bulan berikutnya": the next month with profile, signatures and automation carried over.
 * @param {TimesheetDoc} doc - Document
 * @returns {TimesheetDoc} - Document for the next period
 */
export const createNextMonthDoc = (doc: TimesheetDoc): TimesheetDoc => {
  return resetDocToPeriod(doc, getNextPeriod(doc.period));
};

/**
 * Whether the document holds any month-specific data.
 * @param {TimesheetDoc} doc - Document
 * @returns {boolean} - True when entries, evidence or day markings exist
 */
export const hasPeriodData = (doc: TimesheetDoc): boolean => {
  return doc.entries.length > 0 || Object.keys(doc.evidence).length > 0 || Object.keys(doc.dayOverrides).length > 0;
};

/**
 * Task suggestions for autocomplete: favourite templates first, then used tasks (most recent first).
 * @param {TimesheetDoc} doc - Document
 * @returns {string[]} - Unique, non-empty tasks
 */
export const getTaskSuggestions = (doc: TimesheetDoc): string[] => {
  const used = [...doc.entries].reverse().map((entry) => entry.task);

  return [...new Set([...doc.profile.taskTemplates, ...used].map((task) => task.trim()).filter(Boolean))];
};

/**
 * The entry to copy for "duplikat dari baris sebelumnya": the last entry before the date,
 * or the last entry of the period when none is earlier.
 * @param {TimesheetDoc} doc - Document
 * @param {string} isoDate - Date being filled
 * @returns {Entry | null} - Entry to copy
 */
export const getPreviousEntry = (doc: TimesheetDoc, isoDate: string): Entry | null => {
  const inPeriod = doc.entries.filter((entry) => isInPeriod(entry.date, doc.period));
  const earlier = inPeriod.filter((entry) => entry.date < isoDate);

  return earlier.at(-1) ?? inPeriod.at(-1) ?? null;
};
