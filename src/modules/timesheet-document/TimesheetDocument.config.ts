import type { SheetColumn } from "./TimesheetDocument.type";

/**
 * A4 geometry in points (1pt = 1/72in), measured from `BHN II - Timesheet October.pdf`.
 * All positions are relative to the top-left corner of the page.
 */
export const PAGE = {
  WIDTH_PT: 595.28,
  HEIGHT_PT: 841.89,
} as const;

export const BRAND_RED = "#C00000";

export const HIGHLIGHT_YELLOW = "#FFFF00";

export const DOCUMENT_FONT = "\"Trebuchet MS\", \"Fira Sans\", sans-serif";

export const SHEET_TITLE = "TIMESHEET";

export const LOGO = {
  LEFT_PT: 20,
  TOP_PT: 8,
  WIDTH_PT: 93,
  HEIGHT_PT: 46,
} as const;

export const TITLE_TOP_PT = 76;

export const INFO = {
  TOP_PT: 119,
  LEFT_PT: 42,
  ROW_HEIGHT_PT: 14.5,
  LEFT_LABEL_WIDTH_PT: 106,
  COLON_WIDTH_PT: 6.5,
  LEFT_VALUE_WIDTH_PT: 157,
  RIGHT_LABEL_WIDTH_PT: 99,
  RIGHT_VALUE_WIDTH_PT: 136,
} as const;

/** Info block columns: label, colon, value (left) then label, colon, value (right). */
export const INFO_COLUMN_WIDTHS_PT = [
  INFO.LEFT_LABEL_WIDTH_PT,
  INFO.COLON_WIDTH_PT,
  INFO.LEFT_VALUE_WIDTH_PT,
  INFO.RIGHT_LABEL_WIDTH_PT,
  INFO.COLON_WIDTH_PT,
  INFO.RIGHT_VALUE_WIDTH_PT,
];

export const INFO_LABELS = {
  VENDOR: "Vendor Name",
  CONSULTANT: "Consultant Name",
  // Typo kept on purpose: it is part of the fixed format.
  ROLE: "Consultan Role",
  MONTH: "Month",
  LEAD_PROJECT: "Lead Project/PO",
  TRIBE_LEADER: "Tribe Leader",
  SQUAD: "Squad",
} as const;

export const SHEET_COLUMNS: SheetColumn[] = [
  { key: "date", label: "Date", widthPt: 66, align: "left" },
  { key: "task", label: "Task /Activities/ Project Name/ Ticket Number", widthPt: 246, align: "left" },
  { key: "start", label: "Start Time", widthPt: 42, align: "center" },
  { key: "end", label: "End Time", widthPt: 43, align: "center" },
  { key: "remark", label: "Remark", widthPt: 120, align: "left" },
];

export const TABLE = {
  LEFT_PT: 36,
  WIDTH_PT: 517,
  FIRST_PAGE_TOP_PT: 194,
  NEXT_PAGE_TOP_PT: 9,
  BOTTOM_LIMIT_PT: 822,
  HEADER_HEIGHT_PT: 29,
  WORK_ROW_HEIGHT_PT: 39,
  OFF_ROW_HEIGHT_PT: 22,
  BORDER_PT: 0.75,
  CELL_PADDING_X_PT: 2,
  CELL_PADDING_Y_PT: 2,
  LINE_HEIGHT_PT: 13,
  // Conservative Trebuchet MS 11pt average glyph width, so estimated rows never under-reserve.
  CHAR_WIDTH_PT: 5.6,
} as const;

export const SIGNATURE = {
  TOP_PT: 143.5,
  LEFT_PT: 36.8,
  COLUMN_WIDTHS_PT: [169.5, 183.7, 162.9],
  TEXT_ROW_HEIGHT_PT: 14.6,
  IMAGE_ROW_HEIGHT_PT: 117.3,
  PREPARED_BY: "Prepared by,",
  APPROVED_BY: "Approved by,",
} as const;

export const COVER = {
  LEFT_PT: 36,
  WIDTH_PT: 524.2,
  TOP_BLOCK_TOP_PT: 54.7,
  TOP_BLOCK_HEIGHT_PT: 112,
  BOTTOM_BLOCK_TOP_PT: 373.7,
  BOTTOM_BLOCK_HEIGHT_PT: 410.6,
  FOOTER_TOP_PT: 714,
} as const;

export const EVIDENCE = {
  PAGE_NUMBER_TOP_PT: 38,
  PAGE_NUMBER_RIGHT_PT: 36,
  MONTH_TOP_PT: 72,
  SUBTITLE_TOP_PT: 91.7,
  SUBTITLE: "Foto / Screenshot Evidence",
  FIRST_SLOT_TOP_PT: 128,
  NEXT_SLOT_TOP_PT: 66,
  SLOT_PITCH_PT: 178,
  LABEL_LEFT_PT: 43,
  LABEL_HEIGHT_PT: 14,
  IMAGE_HEIGHT_PT: 140,
  LEFT_IMAGE_LEFT_PT: 43,
  LEFT_IMAGE_WIDTH_PT: 268,
  RIGHT_IMAGE_LEFT_PT: 342,
  RIGHT_IMAGE_WIDTH_PT: 216,
} as const;
