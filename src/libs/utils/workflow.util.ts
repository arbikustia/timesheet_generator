import type { Automation, TimesheetDoc } from "@/types/timesheet.type";
import type { AutomationMerge, BulkFillInput, NewEntryInput, PreviousMonthMerge, ProfileTextField, SignatureKey } from "@/types/timesheet-edit.type";

import { groupEntriesByDate } from "./timesheet-engine.util";
import { getWorkdays } from "./timesheet-validation.util";

/** Profile text fields copied from the previous month when empty (`pdfFilePrefix` and `platform` have defaults). */
const CARRIED_TEXT_FIELDS: ProfileTextField[] = [
  "vendorName",
  "platform",
  "consultantName",
  "consultantRole",
  "leadProject",
  "tribeLeader",
  "squad",
  "footerCompany",
  "footerGroup",
  "pdfFilePrefix",
];

const SIGNATURE_KEYS: SignatureKey[] = ["preparedBy", "leadProject", "tribeLeader"];

/**
 * Working days of the period inside an inclusive range, optionally without dates that already have an activity.
 * @param {TimesheetDoc} doc - Document
 * @param {Pick<BulkFillInput, "from" | "to" | "skipFilled">} range - Range and skip flag
 * @returns {string[]} - ISO dates
 */
export const getBulkFillDates = (doc: TimesheetDoc, range: Pick<BulkFillInput, "from" | "to" | "skipFilled">): string[] => {
  const filled = groupEntriesByDate(doc);

  return getWorkdays(doc).filter((isoDate) => isoDate >= range.from && isoDate <= range.to && !(range.skipFilled && filled.has(isoDate)));
};

/**
 * Entries created by "Isi massal".
 * @param {TimesheetDoc} doc - Document
 * @param {BulkFillInput} input - Range, task and hours
 * @returns {NewEntryInput[]} - One entry per selected working day
 */
export const buildBulkEntries = (doc: TimesheetDoc, input: BulkFillInput): NewEntryInput[] => {
  return getBulkFillDates(doc, input).map((date) => ({ date, task: input.task.trim(), start: input.start, end: input.end }));
};

/**
 * Unique, trimmed, non-empty strings in first-seen order.
 * @param {string[]} values - Values
 * @returns {string[]} - Unique values
 */
const _unique = (values: string[]): string[] => [...new Set(values.map((value) => value.trim()).filter(Boolean))];

/**
 * Automation settings of both months: current values win, missing tickets and repositories are added.
 * @param {Automation} current - This document's automation
 * @param {Automation} previous - Previous document's automation
 * @returns {AutomationMerge} - Merged settings and how many items were added
 */
export const mergeAutomation = (current: Automation, previous: Automation): AutomationMerge => {
  const tickets = Object.entries(previous.ticketMap).filter(([ticket, name]) => name.trim() && !current.ticketMap[ticket]?.trim());
  const repos = previous.repos.filter((repo) => repo.path.trim() && !current.repos.some((item) => item.path === repo.path));

  return {
    automation: { ...current, ticketMap: { ...current.ticketMap, ...Object.fromEntries(tickets) }, repos: [...current.repos, ...repos] },
    added: tickets.length + repos.length,
  };
};

/**
 * "Impor dari bulan lalu" (PROMPT §7): take the profile, signatures and task list of the previous month's file.
 * Only empty fields are filled, so nothing typed this month is overwritten; the period, activities, evidence,
 * day markings and signature date stay as they are. Tasks of the previous month join the favourite templates.
 * @param {TimesheetDoc} doc - This month's document
 * @param {TimesheetDoc} previous - Previous month's document
 * @returns {PreviousMonthMerge} - Updated document and what was taken over
 */
export const mergePreviousMonth = (doc: TimesheetDoc, previous: TimesheetDoc): PreviousMonthMerge => {
  const texts = CARRIED_TEXT_FIELDS.filter((field) => !doc.profile[field].trim() && previous.profile[field].trim());
  const signatures = SIGNATURE_KEYS.filter((key) => !doc.profile.signatures[key] && previous.profile.signatures[key]);
  const templates = _unique([...doc.profile.taskTemplates, ...previous.profile.taskTemplates, ...previous.entries.map((entry) => entry.task)]);
  const automation = mergeAutomation(doc.automation, previous.automation);

  return {
    doc: {
      ...doc,
      profile: {
        ...doc.profile,
        ...Object.fromEntries(texts.map((field) => [field, previous.profile[field]])),
        signatures: { ...doc.profile.signatures, ...Object.fromEntries(signatures.map((key) => [key, previous.profile.signatures[key]])) },
        taskTemplates: templates,
      },
      automation: automation.automation,
    },
    summary: {
      filledFields: texts.length + signatures.length,
      addedTasks: templates.length - _unique(doc.profile.taskTemplates).length,
      addedAutomation: automation.added,
    },
  };
};
