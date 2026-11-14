import type { SelectOption } from "@/types/common.type";
import type { TimesheetDoc } from "@/types/timesheet.type";

import { formatDateOptionLabel, getMonthDates, isWeekend } from "./date.util";
import { groupEntriesByDate } from "./timesheet-engine.util";

/**
 * Status suffix of a date option.
 * @param {TimesheetDoc} doc - Document
 * @param {string} isoDate - ISO date
 * @param {Set<string>} filledDates - Dates that already have entries
 * @returns {string} - Suffix such as ` · terisi`, or empty
 */
const _getDateStatus = (doc: TimesheetDoc, isoDate: string, filledDates: Set<string>): string => {
  if (filledDates.has(isoDate)) {
    return " · terisi";
  }

  if (doc.dayOverrides[isoDate]) {
    return ` · ${doc.dayOverrides[isoDate].label}`;
  }

  return isWeekend(isoDate) ? " · Weekend" : "";
};

/**
 * Date options of the document period, labelled `Kam, 01/10/2026 · terisi`.
 * @param {TimesheetDoc} doc - Document
 * @returns {SelectOption<string>[]} - One option per day of the month
 */
export const getDateOptions = (doc: TimesheetDoc): SelectOption<string>[] => {
  const filledDates = new Set(groupEntriesByDate(doc).keys());

  return getMonthDates(doc.period).map((isoDate) => ({
    value: isoDate,
    label: `${formatDateOptionLabel(isoDate)}${_getDateStatus(doc, isoDate, filledDates)}`,
  }));
};
