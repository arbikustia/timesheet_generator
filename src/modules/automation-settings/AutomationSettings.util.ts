import type { Automation } from "@/types/timesheet.type";

import type { RepoField, TicketRow } from "./AutomationSettings.type";

/**
 * Ticket map as rows sorted by ticket.
 * @param {Automation["ticketMap"]} ticketMap - Ticket → task name
 * @returns {TicketRow[]} - Rows
 */
export const toTicketRows = (ticketMap: Automation["ticketMap"]): TicketRow[] => {
  return Object.entries(ticketMap)
    .map(([ticket, name]) => ({ ticket, name }))
    .sort((a, b) => a.ticket.localeCompare(b.ticket));
};

/**
 * Whether a `data-field` value is an editable repo field.
 * @param {string | undefined} field - Field name
 * @returns {boolean} - True for `path` or `label`
 */
export const isRepoField = (field: string | undefined): field is RepoField => field === "path" || field === "label";

/**
 * Validate a new ticket key against the ticket pattern of the document.
 * @param {string} ticket - Typed ticket
 * @param {string} pattern - `automation.ticketPattern` (regex source)
 * @returns {string | null} - Indonesian error, or null when valid
 */
export const validateTicket = (ticket: string, pattern: string): string | null => {
  if (!ticket.trim()) {
    return "Ticket wajib diisi.";
  }

  try {
    return new RegExp(`^(?:${pattern})$`, "i").test(ticket.trim()) ? null : `Ticket tidak cocok dengan pola ${pattern}.`;
  } catch {
    return null;
  }
};
