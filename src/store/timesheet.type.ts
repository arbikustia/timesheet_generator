import type { TimesheetDoc } from "@/types/timesheet.type";

export type TimesheetState = {
  doc: TimesheetDoc;
  /** The document as last written to a file (or loaded); `doc !== savedDoc` means unsaved changes. */
  savedDoc: TimesheetDoc;
  /** Earlier documents, oldest first (undo stack). */
  past: TimesheetDoc[];
  /** Undone documents, most recent last (redo stack). */
  future: TimesheetDoc[];
  /** Merge key of the last recorded edit; consecutive edits with the same key form one undo step. */
  mergeKey: string | null;
};
