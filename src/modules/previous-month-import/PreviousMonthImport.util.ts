import { formatPeriodLabelId } from "@/libs/utils/date.util";

import type { Period } from "@/types/timesheet.type";
import type { PreviousMonthSummary } from "@/types/timesheet-edit.type";

import type { ImportNotice } from "./PreviousMonthImport.type";

/**
 * Feedback after importing from a previous month's file.
 * @param {PreviousMonthSummary} summary - What was taken over
 * @param {Period} period - Period of the source file
 * @returns {ImportNotice} - Notice
 */
export const describePreviousImport = (summary: PreviousMonthSummary, period: Period): ImportNotice => {
  const source = formatPeriodLabelId(period);

  if (summary.filledFields + summary.addedTasks + summary.addedAutomation === 0) {
    return { type: "info", text: `Dari ${source}: tidak ada yang perlu diambil, profil dan daftar task sudah lengkap.` };
  }

  return {
    type: "success",
    text: `Dari ${source}: ${summary.filledFields} isian profil/tanda tangan, ${summary.addedTasks} task favorit, ${summary.addedAutomation} ticket/repo.`,
  };
};
