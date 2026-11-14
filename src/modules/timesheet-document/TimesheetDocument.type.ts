import type { TimesheetDoc } from "@/types/timesheet.type";
import type { EvidencePage, TimesheetRow } from "@/types/timesheet-engine.type";

/** Kind of A4 page, in output order. */
export type PageKind = "sheet" | "signature" | "cover" | "evidence";

/** Evidence image slot of a date. */
export type EvidenceSide = "left" | "right";

/** Keys of the module style map. */
export type StyleKey =
  | "document"
  | "page"
  | "logo"
  | "title"
  | "infoTable"
  | "infoCell"
  | "sheetTable"
  | "headerRow"
  | "headerCell"
  | "cell"
  | "dateCell"
  | "remarkLine"
  | "signatureTable"
  | "signatureCell"
  | "signatureImageCell"
  | "signatureImage"
  | "coverTopBlock"
  | "coverBottomBlock"
  | "coverTitle"
  | "coverFooter"
  | "pageNumber"
  | "evidenceMonth"
  | "evidenceSubtitle"
  | "evidenceSlot"
  | "evidenceLabel"
  | "evidenceImageBox"
  | "evidenceImage";

/** Horizontal alignment of a sheet column. */
export type ColumnAlign = "left" | "center";

/** One column of the timesheet table. */
export type SheetColumn = {
  key: "date" | "task" | "start" | "end" | "remark";
  label: string;
  widthPt: number;
  align: ColumnAlign;
};

/** A line of the info block; `value === null` renders the label alone without a colon. */
export type InfoLine = {
  label: string;
  value: string | null;
};

/** A table row with its reserved height in points. */
export type SheetRow = {
  row: TimesheetRow;
  heightPt: number;
};

/** One timesheet page; only the first page carries the header block and the table header. */
export type SheetPage = {
  index: number;
  isFirst: boolean;
  rows: SheetRow[];
};

/** One column of the signature table. */
export type SignatureColumn = {
  key: "preparedBy" | "leadProject" | "tribeLeader";
  nameLabel: string;
  imageSrc: string | null;
};

export type SignatureView = {
  columns: SignatureColumn[];
  dateLabel: string;
};

export type CoverView = {
  title: string;
  footerLines: string[];
};

/** Everything needed to draw the document; derived once from the document data. */
export type DocumentView = {
  monthLabel: string;
  infoLeft: InfoLine[];
  infoRight: InfoLine[];
  sheetPages: SheetPage[];
  signature: SignatureView;
  cover: CoverView;
  evidencePages: EvidencePage[];
};

export type TimesheetDocumentContainerProps = {
  doc: TimesheetDoc;
};

export type TimesheetDocumentProps = {
  view: DocumentView;
};

export type UseDocumentViewResult = {
  view: DocumentView;
};
