import { formatDateOptionLabel, isInPeriod } from "@/libs/utils/date.util";
import { groupEntriesByDate } from "@/libs/utils/timesheet-engine.util";

import { EVIDENCE_MAX_PER_DATE } from "@/constants/timesheet.constant";
import type { TimesheetDoc } from "@/types/timesheet.type";

import type { EvidenceDateBlock } from "./EvidencePanel.type";

/**
 * Dates that can receive evidence: every date with entries plus any date that already has evidence.
 * @param {TimesheetDoc} doc - Document
 * @param {string | null} activeDate - Date selected for pasting
 * @param {string[]} processingDates - Dates with images being processed
 * @returns {EvidenceDateBlock[]} - Blocks in date order
 */
export const buildEvidenceBlocks = (doc: TimesheetDoc, activeDate: string | null, processingDates: string[]): EvidenceDateBlock[] => {
  const entriesByDate = groupEntriesByDate(doc);
  const evidenceDates = Object.keys(doc.evidence).filter((date) => isInPeriod(date, doc.period));
  const dates = [...new Set([...entriesByDate.keys(), ...evidenceDates])].sort((a, b) => a.localeCompare(b));

  return dates.map((date) => ({
    date,
    label: formatDateOptionLabel(date),
    tasks: [...new Set((entriesByDate.get(date) ?? []).map((entry) => entry.task))].join(" · "),
    images: doc.evidence[date] ?? [],
    hasEntries: entriesByDate.has(date),
    isActive: date === activeDate,
    isProcessing: processingDates.includes(date),
  }));
};

/**
 * Where a paste goes: the active date, or the first date with a free slot.
 * @param {EvidenceDateBlock[]} blocks - Evidence blocks
 * @param {string | null} activeDate - Selected date
 * @returns {string | null} - Target date, or null when nothing can receive it
 */
export const getPasteTargetDate = (blocks: EvidenceDateBlock[], activeDate: string | null): string | null => {
  if (activeDate && blocks.some((block) => block.date === activeDate)) {
    return activeDate;
  }

  return blocks.find((block) => block.images.length < EVIDENCE_MAX_PER_DATE)?.date ?? null;
};
