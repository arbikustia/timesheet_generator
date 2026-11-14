import {
  EVIDENCE_FIRST_PAGE_CAPACITY,
  EVIDENCE_PAGE_CAPACITY,
  REMARK_EVIDENCE_LINE,
  REMARK_EVIDENCE_PAGE_PREFIX,
  WEEKEND_LABEL,
} from "@/constants/timesheet.constant";
import type { DayOverride, Entry, TimesheetDoc } from "@/types/timesheet.type";
import type {
  EmptyRow,
  EvidencePage,
  EvidencePageMap,
  OffRow,
  TimesheetRow,
  WorkRow,
} from "@/types/timesheet-engine.type";

import { getMonthDates, isInPeriod, isWeekend } from "./date.util";

/**
 * Dates of the period that have at least one evidence image, ascending.
 * @param {TimesheetDoc} doc - Document
 * @returns {string[]} - ISO dates
 */
export const getEvidenceDates = (doc: TimesheetDoc): string[] => {
  return Object.keys(doc.evidence)
    .filter((isoDate) => isInPeriod(isoDate, doc.period) && doc.evidence[isoDate].length > 0)
    .sort((a, b) => a.localeCompare(b));
};

/**
 * Split evidence dates into pages: 3 dates on the first page, 4 on each following page.
 * @param {TimesheetDoc} doc - Document
 * @returns {EvidencePage[]} - Evidence pages, numbered from 1
 */
export const paginateEvidence = (doc: TimesheetDoc): EvidencePage[] => {
  const dates = getEvidenceDates(doc);
  const pages: EvidencePage[] = [];
  let cursor = 0;

  while (cursor < dates.length) {
    const isFirst = pages.length === 0;
    const capacity = isFirst ? EVIDENCE_FIRST_PAGE_CAPACITY : EVIDENCE_PAGE_CAPACITY;
    const slots = dates
      .slice(cursor, cursor + capacity)
      .map((isoDate) => ({ date: isoDate, images: doc.evidence[isoDate] }));

    pages.push({ pageNumber: pages.length + 1, isFirst, slots });
    cursor += capacity;
  }

  return pages;
};

/**
 * Map each evidence date to the page it appears on.
 * @param {EvidencePage[]} pages - Paginated evidence
 * @returns {EvidencePageMap} - Page number by ISO date
 */
export const getEvidencePageMap = (pages: EvidencePage[]): EvidencePageMap => {
  return new Map(pages.flatMap((page) => page.slots.map((slot) => [slot.date, page.pageNumber] as const)));
};

/**
 * Default remark lines of a work row.
 * @param {number | null} evidencePage - Evidence page of the row's date, null when it has no evidence
 * @returns {string[]} - `["Foto / Screenshot", "Evidence Page N"]`, or only the first line without evidence
 */
export const getEvidenceRemarkLines = (evidencePage: number | null): string[] => {
  if (evidencePage === null) {
    return [REMARK_EVIDENCE_LINE];
  }

  return [REMARK_EVIDENCE_LINE, `${REMARK_EVIDENCE_PAGE_PREFIX} ${evidencePage}`];
};

/**
 * Build the row of one work entry; a manual remark override wins over the computed remark.
 * @param {Entry} entry - Work entry
 * @param {EvidencePageMap} pageMap - Evidence page by date
 * @returns {WorkRow} - Work row
 */
export const _buildWorkRow = (entry: Entry, pageMap: EvidencePageMap): WorkRow => {
  const evidencePage = pageMap.get(entry.date) ?? null;
  const remarkLines =
    entry.remarkOverride === null ? getEvidenceRemarkLines(evidencePage) : entry.remarkOverride.split("\n");

  return {
    kind: "work",
    key: entry.id,
    date: entry.date,
    entryId: entry.id,
    task: entry.task,
    start: entry.start,
    end: entry.end,
    evidencePage,
    remarkLines,
  };
};

/**
 * Build the row(s) of a date that has no entry.
 * @param {string} isoDate - ISO date
 * @param {DayOverride} [override] - Holiday/leave marking of the date
 * @returns {OffRow | EmptyRow} - Red off row, or empty white row for an unfilled working day
 */
export const _buildDateRow = (isoDate: string, override?: DayOverride): OffRow | EmptyRow => {
  if (override) {
    return { kind: "off", key: isoDate, date: isoDate, reason: override.type, remark: override.label };
  }

  if (isWeekend(isoDate)) {
    return { kind: "off", key: isoDate, date: isoDate, reason: "weekend", remark: WEEKEND_LABEL };
  }

  return { kind: "empty", key: isoDate, date: isoDate };
};

/**
 * Group the period's entries by date, keeping their list order within a date.
 * @param {TimesheetDoc} doc - Document
 * @returns {Map<string, Entry[]>} - Entries by ISO date
 */
export const groupEntriesByDate = (doc: TimesheetDoc): Map<string, Entry[]> => {
  const groups = new Map<string, Entry[]>();

  doc.entries
    .filter((entry) => isInPeriod(entry.date, doc.period))
    .forEach((entry) => groups.set(entry.date, [...(groups.get(entry.date) ?? []), entry]));

  return groups;
};

/**
 * Build every table row of the period, 01 → last day. Entries always win over weekend/holiday
 * markings so no data is hidden (the validation panel flags such dates).
 * @param {TimesheetDoc} doc - Document
 * @param {EvidencePageMap} [pageMap] - Evidence page by date; computed from the document when omitted
 * @returns {TimesheetRow[]} - Ordered rows
 */
export const buildTimesheetRows = (doc: TimesheetDoc, pageMap?: EvidencePageMap): TimesheetRow[] => {
  const pages = pageMap ?? getEvidencePageMap(paginateEvidence(doc));
  const entriesByDate = groupEntriesByDate(doc);

  return getMonthDates(doc.period).flatMap((isoDate): TimesheetRow[] => {
    const entries = entriesByDate.get(isoDate);

    if (entries) {
      return entries.map((entry) => _buildWorkRow(entry, pages));
    }

    return [_buildDateRow(isoDate, doc.dayOverrides[isoDate])];
  });
};

/**
 * First working day of the period that is not a weekend, not marked off and has no entry.
 * Used as the default date of the quick-add form.
 * @param {TimesheetDoc} doc - Document
 * @returns {string | null} - ISO date, or null when every working day is filled
 */
export const getNextUnfilledWorkday = (doc: TimesheetDoc): string | null => {
  const entriesByDate = groupEntriesByDate(doc);
  const next = getMonthDates(doc.period).find(
    (isoDate) => !isWeekend(isoDate) && !doc.dayOverrides[isoDate] && !entriesByDate.has(isoDate),
  );

  return next ?? null;
};
