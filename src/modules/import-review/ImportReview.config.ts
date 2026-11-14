import type { EntrySource } from "@/types/timesheet.type";

/** Source labels of review items (Indonesian UI). */
export const SOURCE_LABELS: Record<EntrySource, string> = {
  manual: "Manual",
  git: "Git snapshot",
  vscode: "VS Code",
  "claude-code": "Claude Code",
  import: "Impor",
};

/** How long the "Disalin" feedback stays, in ms. */
export const COPIED_FEEDBACK_MS = 2000;

/** File name shown in the import command before the document has been saved. */
export const UNSAVED_DOC_PLACEHOLDER = "Timesheet-YYYY-MM-Nama.json";
