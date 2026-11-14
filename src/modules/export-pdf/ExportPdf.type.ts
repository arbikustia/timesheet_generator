import type { TimesheetDoc } from "@/types/timesheet.type";

export type ExportPdfContainerProps = {
  /** Open the export check tab (used when errors block the export). */
  onShowCheck: () => void;
};

export type ExportPdfProps = {
  doc: TimesheetDoc;
  /** Where the hidden print copy of the document is mounted (`document.body`). */
  printContainer: HTMLElement;
  errorMessages: string[];
  isBlockedOpen: boolean;
  /** Error of the last "Buka di tab baru", e.g. a blocked pop-up. */
  tabError: string | null;
  onExport: () => void;
  onOpenTab: () => void;
  onCloseBlocked: () => void;
  onShowCheck: () => void;
};
