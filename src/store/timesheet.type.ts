import type { TimesheetDoc } from "@/types/timesheet.type";

export type TimesheetState = {
  doc: TimesheetDoc;
  /** The document as last written to a file (or loaded); `doc !== savedDoc` means unsaved changes. */
  savedDoc: TimesheetDoc;
};
