import type { CSSProperties } from "react";

import type { TimesheetRow } from "@/types/timesheet-engine.type";

import {
  BRAND_RED,
  COVER,
  DOCUMENT_FONT,
  EVIDENCE,
  HIGHLIGHT_YELLOW,
  INFO,
  LOGO,
  PAGE,
  SIGNATURE,
  TABLE,
  TITLE_TOP_PT,
} from "./TimesheetDocument.config";
import type { ColumnAlign, EvidenceSide, StyleKey } from "./TimesheetDocument.type";

const BORDER = `${TABLE.BORDER_PT}pt solid #000000`;

const styles: Record<StyleKey, CSSProperties> = {
  document: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
  },
  page: {
    position: "relative",
    width: "210mm",
    height: "297mm",
    overflow: "hidden",
    boxSizing: "border-box",
    background: "#FFFFFF",
    color: "#000000",
    fontFamily: DOCUMENT_FONT,
    breakAfter: "page",
    printColorAdjust: "exact",
    WebkitPrintColorAdjust: "exact",
  },
  logo: {
    position: "absolute",
    left: `${LOGO.LEFT_PT}pt`,
    top: `${LOGO.TOP_PT}pt`,
    width: `${LOGO.WIDTH_PT}pt`,
    height: `${LOGO.HEIGHT_PT}pt`,
    objectFit: "contain",
  },
  title: {
    position: "absolute",
    top: `${TITLE_TOP_PT}pt`,
    left: 0,
    width: `${PAGE.WIDTH_PT}pt`,
    margin: 0,
    textAlign: "center",
    fontSize: "18pt",
    fontWeight: 700,
    lineHeight: 1.2,
  },
  infoTable: {
    position: "absolute",
    top: `${INFO.TOP_PT}pt`,
    left: `${INFO.LEFT_PT}pt`,
    borderCollapse: "collapse",
    tableLayout: "fixed",
    fontSize: "12pt",
  },
  infoCell: {
    height: `${INFO.ROW_HEIGHT_PT}pt`,
    padding: 0,
    verticalAlign: "top",
    whiteSpace: "nowrap",
    lineHeight: 1.15,
  },
  sheetTable: {
    position: "absolute",
    left: `${TABLE.LEFT_PT}pt`,
    width: `${TABLE.WIDTH_PT}pt`,
    borderCollapse: "collapse",
    tableLayout: "fixed",
  },
  headerRow: {
    height: `${TABLE.HEADER_HEIGHT_PT}pt`,
    background: BRAND_RED,
    color: "#FFFFFF",
  },
  headerCell: {
    border: BORDER,
    padding: `0 ${TABLE.CELL_PADDING_X_PT}pt`,
    textAlign: "center",
    verticalAlign: "middle",
    fontSize: "12pt",
    fontWeight: 700,
    lineHeight: 1.1,
  },
  cell: {
    border: BORDER,
    padding: `${TABLE.CELL_PADDING_Y_PT}pt ${TABLE.CELL_PADDING_X_PT}pt`,
    verticalAlign: "top",
    fontSize: "11pt",
    lineHeight: `${TABLE.LINE_HEIGHT_PT}pt`,
    overflowWrap: "anywhere",
  },
  dateCell: {
    fontSize: "12pt",
    whiteSpace: "nowrap",
  },
  remarkLine: {
    display: "block",
  },
  signatureTable: {
    position: "absolute",
    top: `${SIGNATURE.TOP_PT}pt`,
    left: `${SIGNATURE.LEFT_PT}pt`,
    borderCollapse: "collapse",
    tableLayout: "fixed",
    fontSize: "12pt",
    fontWeight: 700,
  },
  signatureCell: {
    height: `${SIGNATURE.TEXT_ROW_HEIGHT_PT}pt`,
    border: BORDER,
    padding: `0 ${TABLE.CELL_PADDING_X_PT}pt`,
    textAlign: "center",
    verticalAlign: "middle",
    lineHeight: 1.1,
  },
  signatureImageCell: {
    height: `${SIGNATURE.IMAGE_ROW_HEIGHT_PT}pt`,
    border: BORDER,
    padding: 0,
    textAlign: "center",
    verticalAlign: "middle",
  },
  signatureImage: {
    maxWidth: "100%",
    maxHeight: `${SIGNATURE.IMAGE_ROW_HEIGHT_PT}pt`,
    objectFit: "contain",
  },
  coverTopBlock: {
    position: "absolute",
    left: `${COVER.LEFT_PT}pt`,
    top: `${COVER.TOP_BLOCK_TOP_PT}pt`,
    width: `${COVER.WIDTH_PT}pt`,
    height: `${COVER.TOP_BLOCK_HEIGHT_PT}pt`,
    background: BRAND_RED,
  },
  coverBottomBlock: {
    position: "absolute",
    left: `${COVER.LEFT_PT}pt`,
    top: `${COVER.BOTTOM_BLOCK_TOP_PT}pt`,
    width: `${COVER.WIDTH_PT}pt`,
    height: `${COVER.BOTTOM_BLOCK_HEIGHT_PT}pt`,
    background: BRAND_RED,
  },
  coverTitle: {
    position: "absolute",
    left: `${COVER.LEFT_PT}pt`,
    top: `${COVER.TOP_BLOCK_TOP_PT + COVER.TOP_BLOCK_HEIGHT_PT}pt`,
    width: `${COVER.WIDTH_PT}pt`,
    height: `${COVER.BOTTOM_BLOCK_TOP_PT - COVER.TOP_BLOCK_TOP_PT - COVER.TOP_BLOCK_HEIGHT_PT}pt`,
    margin: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    fontSize: "11pt",
    fontWeight: 700,
  },
  coverFooter: {
    position: "absolute",
    left: `${COVER.LEFT_PT}pt`,
    top: `${COVER.FOOTER_TOP_PT}pt`,
    width: `${COVER.WIDTH_PT}pt`,
    margin: 0,
    color: "#FFFFFF",
    textAlign: "center",
    fontSize: "11pt",
    fontWeight: 700,
    lineHeight: 1.75,
  },
  pageNumber: {
    position: "absolute",
    top: `${EVIDENCE.PAGE_NUMBER_TOP_PT}pt`,
    right: `${EVIDENCE.PAGE_NUMBER_RIGHT_PT}pt`,
    margin: 0,
    fontSize: "12pt",
    letterSpacing: "2.5pt",
  },
  evidenceMonth: {
    position: "absolute",
    top: `${EVIDENCE.MONTH_TOP_PT}pt`,
    left: `${TABLE.LEFT_PT}pt`,
    margin: 0,
    fontSize: "12pt",
    fontWeight: 700,
  },
  evidenceSubtitle: {
    position: "absolute",
    top: `${EVIDENCE.SUBTITLE_TOP_PT}pt`,
    left: `${TABLE.LEFT_PT}pt`,
    margin: 0,
    fontSize: "12pt",
    lineHeight: 1.1,
    background: HIGHLIGHT_YELLOW,
  },
  evidenceSlot: {
    position: "absolute",
    left: 0,
    width: "100%",
    height: `${EVIDENCE.LABEL_HEIGHT_PT + EVIDENCE.IMAGE_HEIGHT_PT}pt`,
  },
  evidenceLabel: {
    position: "absolute",
    top: 0,
    left: `${EVIDENCE.LABEL_LEFT_PT}pt`,
    margin: 0,
    fontSize: "10pt",
    lineHeight: 1.2,
  },
  evidenceImageBox: {
    position: "absolute",
    top: `${EVIDENCE.LABEL_HEIGHT_PT}pt`,
    height: `${EVIDENCE.IMAGE_HEIGHT_PT}pt`,
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "flex-start",
  },
  evidenceImage: {
    maxWidth: "100%",
    maxHeight: "100%",
    objectFit: "contain",
  },
};

/** Background/text color per table row kind (Section 9.4 lookup). */
export const ROW_KIND_STYLES: Record<TimesheetRow["kind"], CSSProperties> = {
  work: { background: "#FFFFFF", color: "#000000" },
  empty: { background: "#FFFFFF", color: "#000000" },
  off: { background: BRAND_RED, color: "#FFFFFF" },
};

/** Text alignment per column alignment. */
export const ALIGN_STYLES: Record<ColumnAlign, CSSProperties> = {
  left: { textAlign: "left" },
  center: { textAlign: "center" },
};

/** Horizontal placement of the two evidence images. */
export const EVIDENCE_SIDE_STYLES: Record<EvidenceSide, CSSProperties> = {
  left: { left: `${EVIDENCE.LEFT_IMAGE_LEFT_PT}pt`, width: `${EVIDENCE.LEFT_IMAGE_WIDTH_PT}pt` },
  right: { left: `${EVIDENCE.RIGHT_IMAGE_LEFT_PT}pt`, width: `${EVIDENCE.RIGHT_IMAGE_WIDTH_PT}pt` },
};

export default styles;
