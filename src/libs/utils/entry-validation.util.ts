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

/**
 * Minutes since midnight of a valid `HH:mm` time.
 * @param {string} value - Time text
 * @returns {number | null} - Minutes, or null when the format is invalid
 */
export const toMinutes = (value: string): number | null => {
  if (!isValidTime(value)) {
    return null;
  }

  const [hours, minutes] = value.split(":").map(Number);

  return hours * 60 + minutes;
};

/**
 * Duration of a start/end pair in minutes.
 * @param {string} start - Start `HH:mm`
 * @param {string} end - End `HH:mm`
 * @returns {number} - Minutes; 0 when a time is invalid or end is not after start
 */
export const getDurationMinutes = (start: string, end: string): number => {
  const startMinutes = toMinutes(start);
  const endMinutes = toMinutes(end);

  if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
    return 0;
  }

  return endMinutes - startMinutes;
};
