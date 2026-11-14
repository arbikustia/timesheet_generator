/**
 * Zero-pad to two digits.
 * @param {number} value - Number
 * @returns {string} - Two digits
 */
const _pad = (value: number): string => String(value).padStart(2, "0");

/**
 * Local ISO date of a moment, e.g. `2026-11-14`.
 * @param {Date} date - Moment
 * @returns {string} - Local date
 */
export const toLocalDate = (date: Date): string => `${date.getFullYear()}-${_pad(date.getMonth() + 1)}-${_pad(date.getDate())}`;

/**
 * Local timestamp with offset, e.g. `2026-11-14T09:12:40+07:00` (the worklog format).
 * @param {Date} date - Moment
 * @returns {string} - Timestamp
 */
export const toLocalTimestamp = (date: Date): string => {
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? "+" : "-";
  const time = `${_pad(date.getHours())}:${_pad(date.getMinutes())}:${_pad(date.getSeconds())}`;

  return `${toLocalDate(date)}T${time}${sign}${_pad(Math.floor(Math.abs(offset) / 60))}:${_pad(Math.abs(offset) % 60)}`;
};

/**
 * Local date written in a worklog timestamp (the part before `T`).
 * @param {string} ts - Worklog timestamp
 * @returns {string} - ISO date
 */
export const dateOfTimestamp = (ts: string): string => ts.slice(0, 10);

/**
 * Local `HH:mm` written in a worklog timestamp.
 * @param {string} ts - Worklog timestamp
 * @returns {string} - Time
 */
export const timeOfTimestamp = (ts: string): string => ts.slice(11, 16);
