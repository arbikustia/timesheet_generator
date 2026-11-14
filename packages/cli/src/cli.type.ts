import { z } from "zod";

import { AutomationRepoSchema, EvidenceSensitivitySchema, type TimesheetDoc } from "@/types/timesheet.type";

/** Local timestamp with offset, e.g. `2026-11-14T09:12:40+07:00`. */
const TimestampSchema = z.iso.datetime({ offset: true, local: false });

/** A changed path in a working tree. Paths and line counts only — never file contents. */
export const ChangedFileSchema = z.object({
  path: z.string(),
  status: z.string(),
  add: z.number().int().nonnegative(),
  del: z.number().int().nonnegative(),
});

export const GitSnapshotLineSchema = z.object({
  ts: TimestampSchema,
  kind: z.literal("git-snapshot"),
  repo: z.string(),
  label: z.string(),
  branch: z.string().nullable(),
  ticket: z.string().nullable(),
  changed: z.array(ChangedFileSchema),
  commitsToday: z.number().int().nonnegative(),
  event: z.string().optional(),
});

export const VscodeSaveLineSchema = z.object({
  ts: TimestampSchema,
  kind: z.literal("vscode-save"),
  repo: z.string(),
  branch: z.string().nullable().optional(),
  path: z.string(),
});

export const ClaudeCodeLineSchema = z.object({
  ts: TimestampSchema,
  kind: z.literal("claude-code"),
  event: z.string(),
  cwd: z.string(),
  summary: z.string().optional(),
});

export const EvidenceLineSchema = z.object({
  ts: TimestampSchema,
  kind: z.literal("evidence"),
  date: z.iso.date(),
  path: z.string(),
  sensitivity: EvidenceSensitivitySchema,
});

/** One line of `~/.timesheet/worklog.jsonl` (PROMPT §12.2). */
export const WorklogLineSchema = z.discriminatedUnion("kind", [GitSnapshotLineSchema, VscodeSaveLineSchema, ClaudeCodeLineSchema, EvidenceLineSchema]);

/** Machine-specific settings in `~/.timesheet/config.json` (keeps the document portable). */
export const CliConfigSchema = z.looseObject({
  repos: z.array(AutomationRepoSchema).default([]),
});

export type ChangedFile = z.infer<typeof ChangedFileSchema>;
export type GitSnapshotLine = z.infer<typeof GitSnapshotLineSchema>;
export type VscodeSaveLine = z.infer<typeof VscodeSaveLineSchema>;
export type ClaudeCodeLine = z.infer<typeof ClaudeCodeLineSchema>;
export type EvidenceLine = z.infer<typeof EvidenceLineSchema>;
export type WorklogLine = z.infer<typeof WorklogLineSchema>;
export type CliConfig = z.infer<typeof CliConfigSchema>;

/** One path from `git status --porcelain=v2`. */
export type StatusEntry = {
  path: string;
  /** Index or worktree status letter (`M`, `A`, `D`, `R`, …), `?` for untracked. */
  status: string;
  isUntracked: boolean;
};

export type StatusReport = {
  branch: string | null;
  entries: StatusEntry[];
};

export type LineCounts = {
  add: number;
  del: number;
};

/** Runs a read-only git command in a repository and returns stdout. */
export type GitRunner = (repoPath: string, args: string[]) => Promise<string>;

/** Modification time of a file in ms, or null when it cannot be read. */
export type MtimeReader = (path: string) => Promise<number | null>;

/** Collectors that can produce an entry. */
export type ActivitySource = "git" | "vscode" | "claude-code";

export type SnapshotContext = {
  ticketPattern: string;
  now: Date;
  git: GitRunner;
  mtimeOf?: MtimeReader;
};

/** Activity collected for one date × ticket (or date × repo × branch without a ticket). */
export type ActivityGroup = {
  date: string;
  label: string;
  branch: string | null;
  ticket: string | null;
  sources: Set<ActivitySource>;
  times: string[];
  files: Set<string>;
  summary: string | null;
};

/** Collects activity per date × ticket (fallback date × repository × branch). */
export type ActivityCollector = {
  add: (date: string, label: string, branch: string | null, ticket: string | null) => ActivityGroup;
  groups: () => ActivityGroup[];
};

export type TaskName = {
  task: string;
  needsName: boolean;
};

export type ImportOptions = {
  month: { year: number; month: number };
  repos: { path: string; label: string }[];
};

export type ImportReport = {
  added: number;
  duplicates: number;
  evidenceLines: number;
  invalidLines: number;
};

export type ImportResult = {
  doc: TimesheetDoc;
  report: Omit<ImportReport, "invalidLines">;
};

export type WorklogRead = {
  lines: WorklogLine[];
  invalidLines: number;
};

/** Where the CLI keeps its files (`TIMESHEET_HOME` or `~/.timesheet`). */
export type CliPaths = {
  home: string;
  worklog: string;
  config: string;
};

export type CliArgs = {
  command: string;
  doc: string | null;
  month: string | null;
  repos: string[];
  event: string | null;
};

/** Side effects the CLI needs; tests pass fakes. */
export type CliIo = {
  out: (text: string) => void;
  err: (text: string) => void;
  env: Partial<Record<string, string>>;
  now: () => Date;
  git: GitRunner;
};

export type DoctorCheck = {
  ok: boolean;
  label: string;
  detail: string;
};

/** The part of a Node system error the CLI inspects. */
export type NodeErrorLike = {
  code?: string;
};
