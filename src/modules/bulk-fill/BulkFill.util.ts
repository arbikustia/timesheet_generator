import { formatDateOptionLabel } from "@/libs/utils/date.util";
import { validateEntryInput } from "@/libs/utils/entry-validation.util";
import { getWorkdays } from "@/libs/utils/timesheet-validation.util";

import type { SelectOption } from "@/types/common.type";
import type { TimesheetDoc } from "@/types/timesheet.type";
import type { BulkFillInput } from "@/types/timesheet-edit.type";

import type { BulkFillDraft } from "./BulkFill.type";

/**
 * Working days of the period as select options.
 * @param {TimesheetDoc} doc - Document
 * @returns {SelectOption<string>[]} - Options
 */
export const getWorkdayOptions = (doc: TimesheetDoc): SelectOption<string>[] => {
  return getWorkdays(doc).map((isoDate) => ({ value: isoDate, label: formatDateOptionLabel(isoDate) }));
};

/**
 * Apply the defaults: the whole month of working days and the default hours from Settings.
 * @param {BulkFillDraft} draft - Typed values
 * @param {TimesheetDoc} doc - Document
 * @returns {BulkFillInput} - Complete values
 */
export const resolveBulkFillValues = (draft: BulkFillDraft, doc: TimesheetDoc): BulkFillInput => {
  const workdays = getWorkdays(doc);

  return {
    from: draft.from ?? workdays[0] ?? "",
    to: draft.to ?? workdays.at(-1) ?? "",
    task: draft.task,
    start: draft.start ?? doc.profile.defaults.start,
    end: draft.end ?? doc.profile.defaults.end,
    skipFilled: draft.skipFilled,
  };
};

/**
 * Validate a bulk fill.
 * @param {BulkFillInput} values - Values
 * @param {number} targetCount - Working days that would be filled
 * @returns {string | null} - Indonesian error, or null when valid
 */
export const validateBulkFill = (values: BulkFillInput, targetCount: number): string | null => {
  if (values.from > values.to) {
    return "Tanggal awal harus sebelum tanggal akhir.";
  }

  return validateEntryInput({ ...values, date: values.from }) ?? (targetCount === 0 ? "Tidak ada hari kerja yang bisa diisi di rentang ini." : null);
};
