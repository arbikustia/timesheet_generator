/** Indonesian month names for the app UI (index 0 = Januari). */
export const MONTH_NAMES_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
] as const;

/** Short Indonesian weekday names (index 0 = Minggu, matches `Date#getUTCDay`). */
export const WEEKDAY_SHORT_ID = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"] as const;

/** How many years before and after the current year the period picker offers. */
export const YEAR_RANGE = 3;
