import type { ZodError } from "zod";

import { MONTH_NAMES_EN } from "@/constants/timesheet.constant";
import {
  CURRENT_SCHEMA_VERSION,
  type DocMigration,
  type ParseDocFailure,
  type ParseDocResult,
  type Period,
  type TimesheetDoc,
  TimesheetDocSchema,
  type VersionedDoc,
  VersionedDocSchema,
} from "@/types/timesheet.type";

import { getLastWeekday } from "./date.util";

/**
 * Upgrade steps keyed by the version they upgrade FROM (N → N + 1).
 * Empty while only schema version 1 exists; add `1: migrateV1ToV2` when v2 ships.
 */
export const DOC_MIGRATIONS: Partial<Record<number, DocMigration>> = {};

/**
 * Build a failed parse result.
 * @param {ParseDocFailure["code"]} code - Machine-readable failure code
 * @param {string} message - User-facing message (Indonesian)
 * @param {string[]} [issues=[]] - Detailed issue lines
 * @returns {ParseDocFailure} - Failure result
 */
const _fail = (
  code: ParseDocFailure["code"],
  message: string,
  issues: string[] = [],
): ParseDocFailure => {
  return { isOk: false, code, message, issues };
};

/**
 * Format Zod issues as readable `path: message` lines.
 * @param {ZodError} error - Zod validation error
 * @returns {string[]} - One line per issue
 */
export const _formatIssues = (error: ZodError): string[] => {
  return error.issues.map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`);
};

/**
 * Apply every migration step from the document's version up to the current version.
 * @param {VersionedDoc} doc - Document at any supported version
 * @param {Partial<Record<number, DocMigration>>} [migrations=DOC_MIGRATIONS] - Step registry
 * @returns {VersionedDoc} - Document at `CURRENT_SCHEMA_VERSION`
 */
export const migrateDoc = (
  doc: VersionedDoc,
  migrations: Partial<Record<number, DocMigration>> = DOC_MIGRATIONS,
): VersionedDoc => {
  let current = doc;

  while (current.schemaVersion < CURRENT_SCHEMA_VERSION) {
    const step = migrations[current.schemaVersion];

    if (!step) {
      throw new Error(`Migrasi dari schemaVersion ${current.schemaVersion} tidak tersedia.`);
    }

    current = step(current);
  }

  return current;
};

/**
 * Read a document file's text: JSON → version check → migrate → validate with defaults.
 * This is the single upstream fallback point for document data (Section 9.1).
 * @param {string} text - Raw file contents
 * @returns {ParseDocResult} - Parsed document or a user-facing failure; never throws
 */
export const parseTimesheetDoc = (text: string): ParseDocResult => {
  let raw;

  try {
    raw = JSON.parse(text);
  } catch {
    return _fail("invalid-json", "File bukan JSON yang valid atau rusak.");
  }

  const versioned = VersionedDocSchema.safeParse(raw);

  if (!versioned.success) {
    return _fail("invalid-shape", "File bukan dokumen Timesheet (schemaVersion tidak ditemukan).");
  }

  if (versioned.data.schemaVersion > CURRENT_SCHEMA_VERSION) {
    return _fail(
      "unsupported-version",
      `Dokumen dibuat oleh versi aplikasi yang lebih baru (schemaVersion ${versioned.data.schemaVersion}).`,
    );
  }

  return _validateMigrated(versioned.data);
};

/**
 * Migrate a versioned document and validate it against the current schema.
 * @param {VersionedDoc} versioned - Document with a supported schema version
 * @returns {ParseDocResult} - Parsed document or failure
 */
const _validateMigrated = (versioned: VersionedDoc): ParseDocResult => {
  let migrated;

  try {
    migrated = migrateDoc(versioned);
  } catch (error) {
    return _fail("unsupported-version", (error as Error).message);
  }

  const parsed = TimesheetDocSchema.safeParse(migrated);

  if (!parsed.success) {
    return _fail("invalid-shape", "Isi dokumen tidak sesuai format Timesheet.", _formatIssues(parsed.error));
  }

  return { isOk: true, doc: parsed.data };
};

/**
 * Serialize a document for writing to disk.
 * @param {TimesheetDoc} doc - Document to save
 * @returns {string} - JSON text (compact; embedded images dominate the size)
 */
export const serializeTimesheetDoc = (doc: TimesheetDoc): string => {
  return JSON.stringify(doc);
};

/**
 * Create a blank document for a period; every other field comes from schema defaults.
 * @param {Period} period - Year and 1-based month
 * @returns {TimesheetDoc} - New empty document
 */
export const createEmptyDoc = (period: Period): TimesheetDoc => {
  return TimesheetDocSchema.parse({
    schemaVersion: CURRENT_SCHEMA_VERSION,
    profile: { signDate: getLastWeekday(period) },
    period,
  });
};

/**
 * Build the default file name `Timesheet-{YYYY}-{MM}-{Consultant}.json`.
 * @param {TimesheetDoc} doc - Document to name
 * @returns {string} - File name safe for common file systems
 */
export const getDefaultDocFileName = (doc: TimesheetDoc): string => {
  const month = String(doc.period.month).padStart(2, "0");
  const consultant = doc.profile.consultantName
    .trim()
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, "-");
  const suffix = consultant ? `-${consultant}` : "";

  return `Timesheet-${doc.period.year}-${month}${suffix}.json`;
};

/**
 * PDF file name without extension, e.g. `BHN II - Timesheet October` (PROMPT §6). Browsers use the page
 * title as the default name when printing to PDF.
 * @param {TimesheetDoc} doc - Document
 * @returns {string} - File name
 */
export const getPdfFileTitle = (doc: TimesheetDoc): string => {
  const month = MONTH_NAMES_EN[doc.period.month - 1];
  const prefix = doc.profile.pdfFilePrefix.trim().replace(/[\\/:*?"<>|]/g, "");

  return prefix ? `${prefix} ${month}` : month;
};
