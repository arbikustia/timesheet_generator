import { formatDuration } from "@/libs/utils/timesheet-validation.util";

import type { MonthSummary } from "@/types/timesheet-validation.type";

import type { SummaryItem } from "./ExportCheck.type";

/**
 * Month summary as labelled statistics (PROMPT §7 "Ringkasan bulan").
 * @param {MonthSummary} summary - Month summary
 * @returns {SummaryItem[]} - Statistics in display order
 */
export const buildSummaryItems = (summary: MonthSummary): SummaryItem[] => [
  { key: "workdays", label: "Hari kerja terisi", value: `${summary.filledWorkdayCount} / ${summary.workdayCount}` },
  { key: "hours", label: "Total jam", value: formatDuration(summary.totalMinutes) },
  { key: "entries", label: "Aktivitas", value: String(summary.entryCount) },
  { key: "evidence", label: "Halaman evidence", value: `${summary.evidencePageCount} (${summary.evidenceDateCount} tanggal)` },
];
