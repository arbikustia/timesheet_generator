import type { Automation, AutomationRepo, DayOverride, Entry, Evidence, Period, Profile, Signatures, TimesheetDoc, WorkHours } from "./timesheet.type";

/** Fields the user types when adding an activity. */
export type NewEntryInput = Pick<Entry, "date" | "task" | "start" | "end">;

/** Editable fields of an existing entry. */
export type EntryChanges = Partial<Pick<Entry, "date" | "task" | "start" | "end" | "remarkOverride">>;

/** Editable entry fields bound to inline inputs. */
export type EntryField = "date" | "task" | "start" | "end";

/** Plain text fields of the profile edited in Settings. */
export type ProfileTextField = Exclude<
  keyof Profile,
  "signatures" | "defaults" | "taskTemplates" | "signDate"
>;

/** Profile changes accepted by the store (signatures and hours have their own actions). */
export type ProfileChanges = Partial<Omit<Profile, "signatures" | "defaults">>;

/** How existing data is handled when the period changes. */
export type PeriodChangeMode = "move" | "reset";

export type ChangePeriodPayload = {
  period: Period;
  mode: PeriodChangeMode;
};

export type UpdateEntryPayload = {
  id: string;
  changes: EntryChanges;
};

export type MoveEntryPayload = {
  fromIndex: number;
  toIndex: number;
};

export type DayOverridePayload = {
  date: string;
  override: DayOverride | null;
};

export type SignatureKey = keyof Signatures;

export type SignaturePayload = {
  key: SignatureKey;
  dataUrl: string | null;
};

export type DefaultHoursChanges = Partial<WorkHours>;

export type AddEvidencePayload = {
  date: string;
  image: Evidence;
};

export type EvidenceRefPayload = {
  date: string;
  id: string;
};

export type ReplaceEvidencePayload = EvidenceRefPayload & {
  image: Evidence;
};

/** Merge an automatic entry into another row of the same date (the source row is removed). */
export type MergeEntryPayload = {
  sourceId: string;
  targetId: string;
};

export type TicketNamePayload = {
  ticket: string;
  /** Stored as typed (may be empty while editing); collectors ignore empty names. */
  name: string;
};

export type RepoChanges = Partial<AutomationRepo>;

export type UpdateRepoPayload = {
  index: number;
  changes: RepoChanges;
};

/** "Isi massal": the same task and hours for every working day in a range. */
export type BulkFillInput = {
  from: string;
  to: string;
  task: string;
  start: string;
  end: string;
  /** Leave dates that already have an activity untouched. */
  skipFilled: boolean;
};

/** What "Impor dari bulan lalu" took over from the previous document. */
export type PreviousMonthSummary = {
  /** Profile text fields and signatures that were empty and got filled. */
  filledFields: number;
  /** Tasks added to the favourite templates. */
  addedTasks: number;
  /** Ticket names and repositories added. */
  addedAutomation: number;
};

export type AutomationMerge = {
  automation: Automation;
  added: number;
};

export type PreviousMonthMerge = {
  doc: TimesheetDoc;
  summary: PreviousMonthSummary;
};
