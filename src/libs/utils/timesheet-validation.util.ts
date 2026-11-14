import { MAX_DOCUMENT_BYTES } from "@/constants/image.constant";
import { MAX_DAILY_HOURS, MIN_DAILY_HOURS, REQUIRED_PROFILE_FIELD_LABELS, SIGNATURE_LABELS } from "@/constants/validation.constant";
import type { Entry, TimesheetDoc } from "@/types/timesheet.type";
import type { SignatureKey } from "@/types/timesheet-edit.type";
import type {
  MonthSummary,
  RequiredProfileField,
  ValidationIssue,
  ValidationLevel,
  ValidationReport,
  ValidationTarget,
} from "@/types/timesheet-validation.type";

import { formatDateOptionLabel, formatPeriodLabelId, getMonthDates, isInPeriod, isWeekend } from "./date.util";
import { estimateDocumentBytes, formatBytes } from "./document-size.util";
import { getDurationMinutes, isValidTime } from "./entry-validation.util";
import { getEvidenceDates, groupEntriesByDate, paginateEvidence } from "./timesheet-engine.util";

const LEVEL_ORDER: Record<ValidationLevel, number> = { error: 0, warning: 1 };

const REQUIRED_PROFILE_FIELDS: RequiredProfileField[] = ["consultantName", "leadProject", "tribeLeader"];

const SIGNATURE_KEYS: SignatureKey[] = ["preparedBy", "leadProject", "tribeLeader"];

/**
 * Build one check item.
 * @param {string} id - Stable id
 * @param {ValidationLevel} level - Severity
 * @param {string} message - Indonesian message
 * @param {ValidationTarget | null} target - What the item points at
 * @returns {ValidationIssue} - Check item
 */
const _issue = (id: string, level: ValidationLevel, message: string, target: ValidationTarget | null): ValidationIssue => {
  return { id, level, message, target };
};

/**
 * Duration label for the app UI, e.g. `162 jam` or `7 jam 30 mnt`.
 * @param {number} minutes - Duration in minutes
 * @returns {string} - Label
 */
export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  return rest === 0 ? `${hours} jam` : `${hours} jam ${rest} mnt`;
};

/**
 * Working days of the period: Monday–Friday that are not marked as holiday or leave.
 * @param {TimesheetDoc} doc - Document
 * @returns {string[]} - ISO dates
 */
export const getWorkdays = (doc: TimesheetDoc): string[] => {
  return getMonthDates(doc.period).filter((isoDate) => !isWeekend(isoDate) && !doc.dayOverrides[isoDate]);
};

/**
 * Total valid duration of a list of entries.
 * @param {Entry[]} entries - Entries
 * @returns {number} - Minutes
 */
const _sumMinutes = (entries: Entry[]): number => {
  return entries.reduce((total, entry) => total + getDurationMinutes(entry.start, entry.end), 0);
};

/**
 * Month summary: filled working days, total hours and evidence pages.
 * @param {TimesheetDoc} doc - Document
 * @returns {MonthSummary} - Summary
 */
export const buildMonthSummary = (doc: TimesheetDoc): MonthSummary => {
  const workdays = getWorkdays(doc);
  const entriesByDate = groupEntriesByDate(doc);
  const periodEntries = [...entriesByDate.values()].flat();

  return {
    workdayCount: workdays.length,
    filledWorkdayCount: workdays.filter((isoDate) => entriesByDate.has(isoDate)).length,
    entryCount: periodEntries.length,
    totalMinutes: _sumMinutes(periodEntries),
    evidenceDateCount: getEvidenceDates(doc).length,
    evidencePageCount: paginateEvidence(doc).length,
  };
};

/**
 * Errors of one entry: outside the period, empty task, bad time format, end not after start, not reviewed.
 * @param {Entry} entry - Entry
 * @param {TimesheetDoc} doc - Document
 * @returns {ValidationIssue[]} - Errors
 */
export const _checkEntry = (entry: Entry, doc: TimesheetDoc): ValidationIssue[] => {
  const label = formatDateOptionLabel(entry.date);
  const target: ValidationTarget = { kind: "entry", entryId: entry.id };
  const issues: ValidationIssue[] = [];

  if (!isInPeriod(entry.date, doc.period)) {
    issues.push(_issue(`entry-period:${entry.id}`, "error", `Tanggal ${label} di luar periode ${formatPeriodLabelId(doc.period)}.`, target));
  }

  if (!entry.task.trim()) {
    issues.push(_issue(`entry-task:${entry.id}`, "error", `Task kosong pada ${label}.`, target));
  }

  if (!isValidTime(entry.start) || !isValidTime(entry.end)) {
    issues.push(_issue(`entry-time:${entry.id}`, "error", `Format jam salah pada ${label} (harus HH:mm).`, target));
  } else if (entry.end <= entry.start) {
    issues.push(_issue(`entry-order:${entry.id}`, "error", `Jam selesai harus setelah jam mulai pada ${label}.`, target));
  }

  if (!entry.reviewed) {
    issues.push(_issue(`entry-review:${entry.id}`, "error", `Aktivitas otomatis ${label} belum direview.`, target));
  }

  return issues;
};

/**
 * Warnings of one date of the period.
 * @param {string} isoDate - ISO date
 * @param {TimesheetDoc} doc - Document
 * @param {Entry[]} entries - Entries of the date (empty when none)
 * @returns {ValidationIssue[]} - Warnings
 */
export const _checkDate = (isoDate: string, doc: TimesheetDoc, entries: Entry[]): ValidationIssue[] => {
  const label = formatDateOptionLabel(isoDate);
  const hasEvidence = (doc.evidence[isoDate] ?? []).length > 0;
  const override = doc.dayOverrides[isoDate];
  const isOffDay = isWeekend(isoDate) || Boolean(override);

  if (entries.length === 0) {
    if (hasEvidence) {
      return [_issue(`orphan-evidence:${isoDate}`, "warning", `Evidence ${label} tidak punya aktivitas.`, { kind: "evidence", date: isoDate })];
    }

    return isOffDay ? [] : [_issue(`empty:${isoDate}`, "warning", `Hari kerja ${label} belum ada aktivitas.`, { kind: "date", date: isoDate })];
  }

  const issues: ValidationIssue[] = [];
  const minutes = _sumMinutes(entries);

  if (isOffDay) {
    const dayLabel = override ? override.label : "Weekend";

    issues.push(_issue(`off-entry:${isoDate}`, "warning", `Ada aktivitas pada ${label} (${dayLabel}); baris dicetak sebagai hari kerja.`, { kind: "date", date: isoDate }));
  }

  if (!hasEvidence) {
    issues.push(_issue(`no-evidence:${isoDate}`, "warning", `Aktivitas ${label} belum punya evidence.`, { kind: "evidence", date: isoDate }));
  }

  if (minutes < MIN_DAILY_HOURS * 60 || minutes > MAX_DAILY_HOURS * 60) {
    const bound = minutes < MIN_DAILY_HOURS * 60 ? `kurang dari ${MIN_DAILY_HOURS} jam` : `lebih dari ${MAX_DAILY_HOURS} jam`;

    issues.push(_issue(`hours:${isoDate}`, "warning", `Total jam ${label} ${formatDuration(minutes)} (${bound}).`, { kind: "date", date: isoDate }));
  }

  return issues;
};

/**
 * Evidence checks: unblurred code screenshots (error) and evidence outside the period (warning).
 * @param {TimesheetDoc} doc - Document
 * @returns {ValidationIssue[]} - Issues
 */
export const _checkEvidence = (doc: TimesheetDoc): ValidationIssue[] => {
  return Object.entries(doc.evidence).flatMap(([isoDate, images]) => {
    const label = formatDateOptionLabel(isoDate);
    const target: ValidationTarget = { kind: "evidence", date: isoDate };
    const unblurred = images
      .filter((image) => image.sensitivity === "code" && !image.blurred)
      .map((image) => _issue(`blur:${image.id}`, "error", `Screenshot kode pada ${label} belum diblur.`, target));

    if (images.length === 0 || isInPeriod(isoDate, doc.period)) {
      return unblurred;
    }

    return [...unblurred, _issue(`evidence-period:${isoDate}`, "warning", `Evidence ${label} di luar periode dan tidak ikut dicetak.`, target)];
  });
};

/**
 * Signature page checks: consultant/approver names and the three signature images.
 * @param {TimesheetDoc} doc - Document
 * @returns {ValidationIssue[]} - Errors
 */
export const _checkSignaturePage = (doc: TimesheetDoc): ValidationIssue[] => {
  const names = REQUIRED_PROFILE_FIELDS.filter((field) => !doc.profile[field].trim()).map((field) =>
    _issue(`profile:${field}`, "error", `${REQUIRED_PROFILE_FIELD_LABELS[field]} kosong.`, { kind: "profile", field }),
  );
  const signatures = SIGNATURE_KEYS.filter((key) => !doc.profile.signatures[key]).map((key) =>
    _issue(`signature:${key}`, "error", `${SIGNATURE_LABELS[key]} belum diunggah.`, { kind: "signature", key }),
  );

  return [...names, ...signatures];
};

/**
 * Full "Cek sebelum export" report (PROMPT §7): errors block the export, warnings never do.
 * @param {TimesheetDoc} doc - Document
 * @returns {ValidationReport} - Sorted issues (errors first), counts and the month summary
 */
export const validateDoc = (doc: TimesheetDoc): ValidationReport => {
  const entriesByDate = groupEntriesByDate(doc);
  const bytes = estimateDocumentBytes(doc);
  const sizeIssues =
    bytes > MAX_DOCUMENT_BYTES
      ? [_issue("size", "warning", `Ukuran dokumen ${formatBytes(bytes)}, di atas batas ${formatBytes(MAX_DOCUMENT_BYTES)}.`, null)]
      : [];
  const issues = [
    ...doc.entries.flatMap((entry) => _checkEntry(entry, doc)),
    ..._checkEvidence(doc),
    ..._checkSignaturePage(doc),
    ...getMonthDates(doc.period).flatMap((isoDate) => _checkDate(isoDate, doc, entriesByDate.get(isoDate) ?? [])),
    ...sizeIssues,
  ].sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level]);

  return {
    issues,
    errorCount: issues.filter((issue) => issue.level === "error").length,
    warningCount: issues.filter((issue) => issue.level === "warning").length,
    summary: buildMonthSummary(doc),
  };
};
