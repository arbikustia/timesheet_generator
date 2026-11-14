import { MONTH_NAMES_EN } from "@/constants/timesheet.constant";
import { MONTH_NAMES_ID, WEEKDAY_SHORT_ID } from "@/constants/ui.constant";
import type { Period } from "@/types/timesheet.type";

/**
 * Zero-pad a number to two digits.
 * @param {number} value - Number to pad
 * @returns {string} - Two-digit string
 */
const _pad2 = (value: number): string => {
  return String(value).padStart(2, "0");
};

/**
 * Split an ISO `YYYY-MM-DD` date into numeric parts (month is 1-based).
 * @param {string} isoDate - ISO date
 * @returns {number[]} - `[year, month, day]`
 */
const _splitIso = (isoDate: string): number[] => {
  return isoDate.split("-").map(Number);
};

/**
 * Build an ISO date from numeric parts.
 * @param {number} year - Full year
 * @param {number} month - 1-based month
 * @param {number} day - Day of month
 * @returns {string} - ISO `YYYY-MM-DD`
 */
export const toIsoDate = (year: number, month: number, day: number): string => {
  return `${year}-${_pad2(month)}-${_pad2(day)}`;
};

/**
 * Number of days in a period (handles leap years).
 * @param {Period} period - Year and 1-based month
 * @returns {number} - 28 to 31
 */
export const getDaysInMonth = (period: Period): number => {
  return new Date(Date.UTC(period.year, period.month, 0)).getUTCDate();
};

/**
 * Every date of a period in order, 01 → last day.
 * @param {Period} period - Year and 1-based month
 * @returns {string[]} - ISO dates
 */
export const getMonthDates = (period: Period): string[] => {
  return Array.from({ length: getDaysInMonth(period) }, (_, index) =>
    toIsoDate(period.year, period.month, index + 1),
  );
};

/**
 * Whether an ISO date falls on Saturday or Sunday (timezone-independent).
 * @param {string} isoDate - ISO date
 * @returns {boolean} - True on weekends
 */
export const isWeekend = (isoDate: string): boolean => {
  const weekday = getWeekday(isoDate);

  return weekday === 0 || weekday === 6;
};

/**
 * Whether an ISO date belongs to a period.
 * @param {string} isoDate - ISO date
 * @param {Period} period - Year and 1-based month
 * @returns {boolean} - True when year and month match
 */
export const isInPeriod = (isoDate: string, period: Period): boolean => {
  return isoDate.startsWith(`${period.year}-${_pad2(period.month)}-`);
};

/**
 * Last Monday–Friday of a period (default signature date).
 * @param {Period} period - Year and 1-based month
 * @returns {string} - ISO date
 */
export const getLastWeekday = (period: Period): string => {
  const weekdays = getMonthDates(period).filter((isoDate) => !isWeekend(isoDate));

  return weekdays[weekdays.length - 1];
};

/**
 * Table date format `DD/MM/YYYY`.
 * @param {string} isoDate - ISO date
 * @returns {string} - Formatted date
 */
export const formatDateSlash = (isoDate: string): string => {
  const [year, month, day] = _splitIso(isoDate);

  return `${_pad2(day)}/${_pad2(month)}/${year}`;
};

/**
 * Evidence label format `DD-MM-YYYY`.
 * @param {string} isoDate - ISO date
 * @returns {string} - Formatted date
 */
export const formatDateDash = (isoDate: string): string => {
  const [year, month, day] = _splitIso(isoDate);

  return `${_pad2(day)}-${_pad2(month)}-${year}`;
};

/**
 * Period label in English, e.g. `October 2026`.
 * @param {Period} period - Year and 1-based month
 * @returns {string} - `MMMM YYYY`
 */
export const formatMonthYear = (period: Period): string => {
  return `${MONTH_NAMES_EN[period.month - 1]} ${period.year}`;
};

/**
 * Signature date in English, e.g. `30 October 2026`.
 * @param {string} isoDate - ISO date
 * @returns {string} - `D MMMM YYYY`
 */
export const formatLongDate = (isoDate: string): string => {
  const [year, month, day] = _splitIso(isoDate);

  return `${day} ${MONTH_NAMES_EN[month - 1]} ${year}`;
};

/**
 * Weekday index of an ISO date (0 = Sunday), timezone-independent.
 * @param {string} isoDate - ISO date
 * @returns {number} - 0 to 6
 */
export const getWeekday = (isoDate: string): number => {
  const [year, month, day] = _splitIso(isoDate);

  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
};

/**
 * Period of a calendar date in local time.
 * @param {Date} [now=new Date()] - Reference date
 * @returns {Period} - Year and 1-based month
 */
export const getCurrentPeriod = (now: Date = new Date()): Period => {
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
};

/**
 * The period right after the given one.
 * @param {Period} period - Year and 1-based month
 * @returns {Period} - Next month, rolling over the year
 */
export const getNextPeriod = (period: Period): Period => {
  return period.month === 12 ? { year: period.year + 1, month: 1 } : { year: period.year, month: period.month + 1 };
};

/**
 * Day of month of an ISO date.
 * @param {string} isoDate - ISO date
 * @returns {number} - 1 to 31
 */
export const getDayOfMonth = (isoDate: string): number => {
  return _splitIso(isoDate)[2];
};

/**
 * Date label for the app UI, e.g. `Kam, 01/10/2026`.
 * @param {string} isoDate - ISO date
 * @returns {string} - Indonesian weekday + `DD/MM/YYYY`
 */
export const formatDateOptionLabel = (isoDate: string): string => {
  return `${WEEKDAY_SHORT_ID[getWeekday(isoDate)]}, ${formatDateSlash(isoDate)}`;
};

/**
 * Period label in Indonesian for the app UI, e.g. `Oktober 2026`.
 * @param {Period} period - Year and 1-based month
 * @returns {string} - Label
 */
export const formatPeriodLabelId = (period: Period): string => {
  return `${MONTH_NAMES_ID[period.month - 1]} ${period.year}`;
};
