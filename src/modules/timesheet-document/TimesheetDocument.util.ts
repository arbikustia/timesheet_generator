import { formatLongDate, formatMonthYear } from "@/libs/utils/date.util";
import { buildTimesheetRows, getEvidencePageMap, paginateEvidence } from "@/libs/utils/timesheet-engine.util";

import type { Profile, TimesheetDoc } from "@/types/timesheet.type";
import type { TimesheetRow } from "@/types/timesheet-engine.type";

import { INFO_LABELS, SHEET_COLUMNS, TABLE } from "./TimesheetDocument.config";
import type {
  CoverView,
  DocumentView,
  InfoLine,
  SheetColumn,
  SheetPage,
  SheetRow,
  SignatureView,
} from "./TimesheetDocument.type";

/**
 * Count wrapped lines of one paragraph; a word longer than a line spans several lines.
 * @param {string} paragraph - Text without line breaks
 * @param {number} charsPerLine - Characters that fit on one line
 * @returns {number} - Line count, at least 1
 */
const _countParagraphLines = (paragraph: string, charsPerLine: number): number => {
  let lines = 1;
  let used = 0;

  paragraph
    .split(" ")
    .filter(Boolean)
    .forEach((word) => {
      if (used > 0 && used + 1 + word.length <= charsPerLine) {
        used += 1 + word.length;

        return;
      }

      const extraLines = Math.ceil(word.length / charsPerLine) - 1;

      lines += (used > 0 ? 1 : 0) + extraLines;
      used = word.length - extraLines * charsPerLine;
    });

  return lines;
};

/**
 * Estimate how many lines a text wraps to with greedy word wrapping.
 * @param {string} text - Text, `\n` forces a new line
 * @param {number} charsPerLine - Characters that fit on one line
 * @returns {number} - Line count, at least 1
 */
export const estimateLineCount = (text: string, charsPerLine: number): number => {
  return text.split("\n").reduce((total, paragraph) => total + _countParagraphLines(paragraph, charsPerLine), 0);
};

/**
 * Characters that fit in a sheet column at 11pt.
 * @param {SheetColumn["key"]} key - Column key
 * @returns {number} - Characters per line
 */
export const getColumnCharsPerLine = (key: SheetColumn["key"]): number => {
  const column = SHEET_COLUMNS.find((item) => item.key === key);
  const usable = (column?.widthPt ?? 0) - TABLE.CELL_PADDING_X_PT * 2;

  return Math.max(1, Math.floor(usable / TABLE.CHAR_WIDTH_PT));
};

/**
 * Reserved height of a table row: fixed for off/empty rows, grows with wrapped text for work rows.
 * @param {TimesheetRow} row - Table row
 * @returns {number} - Height in points
 */
export const getRowHeight = (row: TimesheetRow): number => {
  switch (row.kind) {
    case "off":
      return TABLE.OFF_ROW_HEIGHT_PT;
    case "empty":
      return TABLE.WORK_ROW_HEIGHT_PT;
    case "work": {
      const lines = Math.max(
        estimateLineCount(row.task, getColumnCharsPerLine("task")),
        estimateLineCount(row.remarkLines.join("\n"), getColumnCharsPerLine("remark")),
      );

      return Math.max(TABLE.WORK_ROW_HEIGHT_PT, lines * TABLE.LINE_HEIGHT_PT + TABLE.CELL_PADDING_Y_PT * 2);
    }
    default: {
      const exhaustive: never = row;

      return exhaustive;
    }
  }
};

/**
 * Flow rows onto pages without splitting a row; the table header exists only on the first page.
 * @param {TimesheetRow[]} rows - Table rows in order
 * @returns {SheetPage[]} - At least one page
 */
export const paginateSheetRows = (rows: TimesheetRow[]): SheetPage[] => {
  const pages: SheetPage[] = [{ index: 0, isFirst: true, rows: [] }];
  let cursor = TABLE.FIRST_PAGE_TOP_PT + TABLE.HEADER_HEIGHT_PT;

  rows.forEach((row) => {
    const sheetRow: SheetRow = { row, heightPt: getRowHeight(row) };
    const current = pages[pages.length - 1];

    if (cursor + sheetRow.heightPt > TABLE.BOTTOM_LIMIT_PT && current.rows.length > 0) {
      pages.push({ index: pages.length, isFirst: false, rows: [sheetRow] });
      cursor = TABLE.NEXT_PAGE_TOP_PT + sheetRow.heightPt;

      return;
    }

    current.rows.push(sheetRow);
    cursor += sheetRow.heightPt;
  });

  return pages;
};

/**
 * Info block lines: consultant details on the left, project details on the right.
 * @param {Profile} profile - Document profile
 * @param {string} monthLabel - `MMMM YYYY`
 * @returns {InfoLine[][]} - `[left, right]`
 */
export const buildInfoLines = (profile: Profile, monthLabel: string): InfoLine[][] => {
  return [
    [
      { label: INFO_LABELS.VENDOR, value: profile.vendorName },
      { label: INFO_LABELS.CONSULTANT, value: profile.consultantName },
      { label: INFO_LABELS.ROLE, value: profile.consultantRole },
      { label: INFO_LABELS.MONTH, value: monthLabel },
    ],
    [
      { label: profile.platform, value: null },
      { label: INFO_LABELS.LEAD_PROJECT, value: profile.leadProject },
      { label: INFO_LABELS.TRIBE_LEADER, value: profile.tribeLeader },
      { label: INFO_LABELS.SQUAD, value: profile.squad },
    ],
  ];
};

/**
 * Signature table content. The first name label keeps the original spacing `Name : `.
 * @param {Profile} profile - Document profile
 * @returns {SignatureView} - Signature columns and date label
 */
export const buildSignatureView = (profile: Profile): SignatureView => {
  return {
    columns: [
      { key: "preparedBy", nameLabel: `Name : ${profile.consultantName}`, imageSrc: profile.signatures.preparedBy },
      { key: "leadProject", nameLabel: `Name: ${profile.leadProject}`, imageSrc: profile.signatures.leadProject },
      { key: "tribeLeader", nameLabel: `Name: ${profile.tribeLeader}`, imageSrc: profile.signatures.tribeLeader },
    ],
    dateLabel: `Date: ${formatLongDate(profile.signDate)}`,
  };
};

/**
 * Evidence cover texts, e.g. `EVIDENCE OCTOBER 2026 – ARBI KUSTIA – FRONT END DEVELOPER – EPICS ASUM`.
 * @param {Profile} profile - Document profile
 * @param {string} monthLabel - `MMMM YYYY`
 * @returns {CoverView} - Title and footer lines
 */
export const buildCoverView = (profile: Profile, monthLabel: string): CoverView => {
  const parts = [`EVIDENCE ${monthLabel}`, profile.consultantName, profile.consultantRole, profile.squad];

  return {
    title: parts.join(" – ").toUpperCase(),
    footerLines: [profile.footerCompany, profile.footerGroup],
  };
};

/**
 * Derive every page of the output document from the document data.
 * @param {TimesheetDoc} doc - Parsed document
 * @returns {DocumentView} - Render-ready view
 */
export const buildDocumentView = (doc: TimesheetDoc): DocumentView => {
  const monthLabel = formatMonthYear(doc.period);
  const evidencePages = paginateEvidence(doc);
  const [infoLeft, infoRight] = buildInfoLines(doc.profile, monthLabel);

  return {
    monthLabel,
    infoLeft,
    infoRight,
    sheetPages: paginateSheetRows(buildTimesheetRows(doc, getEvidencePageMap(evidencePages))),
    signature: buildSignatureView(doc.profile),
    cover: buildCoverView(doc.profile, monthLabel),
    evidencePages,
  };
};
