import type { FileStatusInput } from "./FileMenu.type";

/**
 * Local `HH:mm` of an ISO timestamp.
 * @param {string} iso - ISO timestamp
 * @returns {string} - Time label
 */
export const formatClock = (iso: string): string => {
  const date = new Date(iso);

  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
};

/**
 * Status indicator text, e.g. `Tersimpan 14:03` or `Belum disimpan ● · draft 14:05`.
 * @param {FileStatusInput} input - File state
 * @returns {string} - Status text
 */
export const getFileStatusText = (input: FileStatusInput): string => {
  if (!input.isDirty) {
    return input.lastSavedAt ? `Tersimpan ${formatClock(input.lastSavedAt)}` : "Tersimpan";
  }

  return input.lastDraftAt ? `Belum disimpan ● · draft ${formatClock(input.lastDraftAt)}` : "Belum disimpan ●";
};

/**
 * Turn any thrown value into a readable message.
 * @param {Error | DOMException | string} error - Thrown value
 * @returns {string} - Message
 */
export const toErrorMessage = (error: Error | DOMException | string): string => {
  return typeof error === "string" ? error : error.message;
};
