import type { DayOverrideType } from "@/types/timesheet.type";

/** English month names used in the output document (index 0 = January). */
export const MONTH_NAMES_EN = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/** Number of evidence dates on the first evidence page (it also carries the month header). */
export const EVIDENCE_FIRST_PAGE_CAPACITY = 3;

/** Number of evidence dates on every following evidence page. */
export const EVIDENCE_PAGE_CAPACITY = 4;

/** Maximum evidence images per date (left and right slot). */
export const EVIDENCE_MAX_PER_DATE = 2;

/** Remark text for Saturday/Sunday rows. */
export const WEEKEND_LABEL = "Weekend";

/** Remark text suggested for each day override type. */
export const DAY_OVERRIDE_DEFAULT_LABELS: Record<DayOverrideType, string> = {
  holiday: "Public Holiday",
  leave: "Leave",
};

/** First remark line of a work row. */
export const REMARK_EVIDENCE_LINE = "Foto / Screenshot";

/** Prefix of the second remark line of a work row: `Evidence Page {N}`. */
export const REMARK_EVIDENCE_PAGE_PREFIX = "Evidence Page";
