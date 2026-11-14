import type { Evidence } from "./timesheet.type";

/** Why a table row is rendered red with only a remark. */
export type OffRowReason = "weekend" | "holiday" | "leave";

/** A work entry row: white, with task, times and remark lines. */
export type WorkRow = {
  kind: "work";
  key: string;
  date: string;
  entryId: string;
  task: string;
  start: string;
  end: string;
  evidencePage: number | null;
  remarkLines: string[];
};

/** A weekend / holiday / leave row: red, only the remark is filled. */
export type OffRow = {
  kind: "off";
  key: string;
  date: string;
  reason: OffRowReason;
  remark: string;
};

/** A working day without any entry: white, empty cells (validation warns). */
export type EmptyRow = {
  kind: "empty";
  key: string;
  date: string;
};

export type TimesheetRow = WorkRow | OffRow | EmptyRow;

/** One date block on an evidence page: label + up to two images. */
export type EvidenceSlot = {
  date: string;
  images: Evidence[];
};

/** One evidence page (`Page | {pageNumber}`). */
export type EvidencePage = {
  pageNumber: number;
  isFirst: boolean;
  slots: EvidenceSlot[];
};

/** Evidence page number keyed by ISO date. */
export type EvidencePageMap = Map<string, number>;
