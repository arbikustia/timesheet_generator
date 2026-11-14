import { z } from "zod";

/** Current document schema version written by this app. */
export const CURRENT_SCHEMA_VERSION = 1;

const TIME_DEFAULT_START = "08:00";
const TIME_DEFAULT_END = "17:00";

export const EntrySourceSchema = z.enum(["manual", "git", "vscode", "claude-code", "import"]);

export const DayOverrideTypeSchema = z.enum(["holiday", "leave"]);

export const EvidenceSensitivitySchema = z.enum(["plain", "code"]);

export const SignaturesSchema = z.object({
  preparedBy: z.string().nullable().default(null),
  leadProject: z.string().nullable().default(null),
  tribeLeader: z.string().nullable().default(null),
});

export const WorkHoursSchema = z.object({
  start: z.string().default(TIME_DEFAULT_START),
  end: z.string().default(TIME_DEFAULT_END),
});

export const ProfileSchema = z.object({
  vendorName: z.string().default(""),
  platform: z.string().default("Legacy Platform"),
  consultantName: z.string().default(""),
  consultantRole: z.string().default(""),
  leadProject: z.string().default(""),
  tribeLeader: z.string().default(""),
  squad: z.string().default(""),
  footerCompany: z.string().default(""),
  footerGroup: z.string().default(""),
  signDate: z.iso.date(),
  signatures: SignaturesSchema.prefault({}),
  defaults: WorkHoursSchema.prefault({}),
  taskTemplates: z.array(z.string()).default([]),
  pdfFilePrefix: z.string().default("BHN II - Timesheet"),
});

export const PeriodSchema = z.object({
  year: z.number().int().min(1970).max(9999),
  month: z.number().int().min(1).max(12),
});

/** Real working hours seen by collectors (first/last activity), shown as a hint during review. */
export const TimeHintSchema = z.object({
  first: z.string(),
  last: z.string(),
});

/** Where an automatic entry came from; never rendered in the PDF. Paths only, never file contents. */
export const EntryRefsSchema = z.object({
  repo: z.string().optional(),
  branch: z.string().optional(),
  ticket: z.string().optional(),
  hint: TimeHintSchema.optional(),
  files: z.array(z.string()).optional(),
  /** Filtered Claude Code session summary (≤ 120 chars). */
  summary: z.string().max(120).optional(),
  /** The task text was generated from the ticket/branch; a name is still needed. */
  needsName: z.boolean().optional(),
});

export const EntrySchema = z.object({
  id: z.string().min(1),
  date: z.iso.date(),
  task: z.string().default(""),
  start: z.string(),
  end: z.string(),
  remarkOverride: z.string().nullable().default(null),
  source: EntrySourceSchema.default("manual"),
  reviewed: z.boolean().default(true),
  refs: EntryRefsSchema.optional(),
});

export const DayOverrideSchema = z.object({
  type: DayOverrideTypeSchema,
  label: z.string(),
});

export const EvidenceSchema = z.object({
  id: z.string().min(1),
  name: z.string().default(""),
  mime: z.string(),
  dataUrl: z.string().startsWith("data:"),
  w: z.number().positive(),
  h: z.number().positive(),
  sensitivity: EvidenceSensitivitySchema.default("plain"),
  blurred: z.boolean().default(false),
});

export const AutomationRepoSchema = z.object({
  path: z.string(),
  label: z.string(),
});

export const AutomationSchema = z.object({
  repos: z.array(AutomationRepoSchema).default([]),
  ticketMap: z.record(z.string(), z.string()).default({}),
  evidenceFolder: z.string().nullable().default(null),
  ticketPattern: z.string().default("(BIT|ASUM)-\\d+"),
});

export const TimesheetDocSchema = z.object({
  schemaVersion: z.literal(CURRENT_SCHEMA_VERSION),
  profile: ProfileSchema,
  period: PeriodSchema,
  entries: z.array(EntrySchema).default([]),
  dayOverrides: z.record(z.iso.date(), DayOverrideSchema).default({}),
  evidence: z.record(z.iso.date(), z.array(EvidenceSchema).max(2)).default({}),
  automation: AutomationSchema.prefault({}),
});

/** Minimal shape every document file shares across versions; used before migration. */
export const VersionedDocSchema = z.looseObject({
  schemaVersion: z.number().int().positive(),
});

export type EntrySource = z.infer<typeof EntrySourceSchema>;
export type DayOverrideType = z.infer<typeof DayOverrideTypeSchema>;
export type EvidenceSensitivity = z.infer<typeof EvidenceSensitivitySchema>;
export type Signatures = z.infer<typeof SignaturesSchema>;
export type WorkHours = z.infer<typeof WorkHoursSchema>;
export type Profile = z.infer<typeof ProfileSchema>;
export type Period = z.infer<typeof PeriodSchema>;
export type TimeHint = z.infer<typeof TimeHintSchema>;
export type EntryRefs = z.infer<typeof EntryRefsSchema>;
export type Entry = z.infer<typeof EntrySchema>;
export type DayOverride = z.infer<typeof DayOverrideSchema>;
export type Evidence = z.infer<typeof EvidenceSchema>;
export type AutomationRepo = z.infer<typeof AutomationRepoSchema>;
export type Automation = z.infer<typeof AutomationSchema>;
export type TimesheetDoc = z.infer<typeof TimesheetDocSchema>;
export type VersionedDoc = z.infer<typeof VersionedDocSchema>;

/** One upgrade step: turns a document of version N into version N + 1. */
export type DocMigration = (doc: VersionedDoc) => VersionedDoc;

export type ParseDocErrorCode = "invalid-json" | "invalid-shape" | "unsupported-version";

export type ParseDocSuccess = {
  isOk: true;
  doc: TimesheetDoc;
};

export type ParseDocFailure = {
  isOk: false;
  code: ParseDocErrorCode;
  message: string;
  issues: string[];
};

export type ParseDocResult = ParseDocSuccess | ParseDocFailure;
