import type { Entry, EntryRefs } from "@/types/timesheet.type";

/**
 * Normalize a ticket key, e.g. ` bit-12 ` → `BIT-12`.
 * @param {string} ticket - Ticket text
 * @returns {string} - Upper-case key without surrounding spaces
 */
export const normalizeTicket = (ticket: string): string => ticket.trim().toUpperCase();

/**
 * Whether a task is still the name generated from the ticket (`BIT-12 – case transfer`) or just the ticket.
 * @param {string} task - Task text
 * @param {string} ticket - Ticket key
 * @returns {boolean} - True when the user has not named it yet
 */
export const isGeneratedTaskName = (task: string, ticket: string): boolean => {
  const text = task.trim().toUpperCase();

  return text === ticket || text.startsWith(`${ticket} –`) || text.startsWith(`${ticket} -`);
};

/**
 * The ticket name to remember in `ticketMap` when an automatic entry is accepted: only when it needed a
 * name and the user replaced the generated one.
 * @param {Entry} entry - Entry being accepted
 * @returns {{ ticket: string; name: string } | null} - Ticket and name, or null when nothing was learned
 */
export const getLearnedTicketName = (entry: Entry): { ticket: string; name: string } | null => {
  const ticket = entry.refs?.ticket ? normalizeTicket(entry.refs.ticket) : "";
  const name = entry.task.trim();

  if (!entry.refs?.needsName || !ticket || !name || isGeneratedTaskName(name, ticket)) {
    return null;
  }

  return { ticket, name };
};

/**
 * Refs of a row after another automatic row was merged into it: touched files are combined.
 * @param {EntryRefs | undefined} target - Refs of the kept row
 * @param {EntryRefs | undefined} source - Refs of the merged row
 * @returns {EntryRefs | undefined} - Combined refs (unchanged when the source has no files)
 */
export const mergeEntryRefs = (target: EntryRefs | undefined, source: EntryRefs | undefined): EntryRefs | undefined => {
  if (!source?.files?.length) {
    return target;
  }

  return { ...target, files: [...new Set([...(target?.files ?? []), ...source.files])] };
};
