import type { SignatureKey } from "./timesheet-edit.type";

/** Severity of a check: errors block the PDF export, warnings never do (info = the month summary). */
export type ValidationLevel = "error" | "warning";

/** Profile fields the export check requires. */
export type RequiredProfileField = "consultantName" | "leadProject" | "tribeLeader";

/** What a check item points at; clicking the item scrolls/focuses it. */
export type ValidationTarget =
  | { kind: "entry"; entryId: string }
  | { kind: "date"; date: string }
  | { kind: "evidence"; date: string }
  | { kind: "profile"; field: RequiredProfileField }
  | { kind: "signature"; key: SignatureKey };

export type ValidationIssue = {
  /** Stable id (rule + subject), also the React key. */
  id: string;
  level: ValidationLevel;
  message: string;
  target: ValidationTarget | null;
};

/** Month summary (PROMPT §7 "Ringkasan bulan"). */
export type MonthSummary = {
  /** Monday–Friday dates not marked as holiday/leave. */
  workdayCount: number;
  /** Working days that have at least one entry. */
  filledWorkdayCount: number;
  /** Entries inside the period. */
  entryCount: number;
  /** Sum of valid entry durations inside the period, in minutes. */
  totalMinutes: number;
  evidenceDateCount: number;
  evidencePageCount: number;
};

export type ValidationReport = {
  issues: ValidationIssue[];
  errorCount: number;
  warningCount: number;
  summary: MonthSummary;
};
