import type { NewEntryInput } from "@/types/timesheet-edit.type";

/** 24-hour `HH:mm`. */
export const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Whether a time string is valid `HH:mm`.
 * @param {string} value - Time text
 * @returns {boolean} - True when valid
 */
export const isValidTime = (value: string): boolean => {
  return TIME_PATTERN.test(value);
};

/**
 * Validate the fields of a new or edited entry.
 * @param {NewEntryInput} input - Entry fields
 * @returns {string | null} - Indonesian error message, or null when valid
 */
export const validateEntryInput = (input: NewEntryInput): string | null => {
  if (!input.task.trim()) {
    return "Task wajib diisi.";
  }

  if (!isValidTime(input.start) || !isValidTime(input.end)) {
    return "Format jam harus HH:mm.";
  }

  if (input.end <= input.start) {
    return "Jam selesai harus setelah jam mulai.";
  }

  return null;
};
