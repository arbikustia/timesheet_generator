import { formatDateOptionLabel, getMonthDates, isWeekend } from "@/libs/utils/date.util";
import { groupEntriesByDate } from "@/libs/utils/timesheet-engine.util";

import { DAY_OVERRIDE_DEFAULT_LABELS } from "@/constants/timesheet.constant";
import type { TimesheetDoc } from "@/types/timesheet.type";

import type { DayOverrideDraft, DayOverrideItem, DayOverrideValues } from "./DayOverrides.type";

/**
 * Resolve the draft into concrete form values: first unmarked weekday and the type's default label.
 * @param {DayOverrideDraft} draft - Form draft
 * @param {TimesheetDoc} doc - Document
 * @returns {DayOverrideValues} - Values shown in the form
 */
export const resolveOverrideValues = (draft: DayOverrideDraft, doc: TimesheetDoc): DayOverrideValues => {
  const dates = getMonthDates(doc.period);
  const fallbackDate = dates.find((isoDate) => !isWeekend(isoDate) && !doc.dayOverrides[isoDate]) ?? dates[0];

  return {
    date: draft.date && dates.includes(draft.date) ? draft.date : fallbackDate,
    type: draft.type,
    label: draft.label ?? DAY_OVERRIDE_DEFAULT_LABELS[draft.type],
  };
};

/**
 * Marked days of the period in date order, flagged when entries exist on that day.
 * @param {TimesheetDoc} doc - Document
 * @returns {DayOverrideItem[]} - Items
 */
export const buildOverrideItems = (doc: TimesheetDoc): DayOverrideItem[] => {
  const entriesByDate = groupEntriesByDate(doc);

  return Object.entries(doc.dayOverrides)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, override]) => ({
      date,
      dateLabel: formatDateOptionLabel(date),
      override,
      hasEntries: entriesByDate.has(date),
    }));
};
