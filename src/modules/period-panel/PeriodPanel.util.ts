import { MONTH_NAMES_ID, YEAR_RANGE } from "@/constants/ui.constant";
import type { SelectOption } from "@/types/common.type";

/**
 * Month options in Indonesian (value 1–12).
 * @returns {SelectOption<number>[]} - Twelve options
 */
export const getMonthOptions = (): SelectOption<number>[] => {
  return MONTH_NAMES_ID.map((label, index) => ({ value: index + 1, label }));
};

/**
 * Year options: current year ± YEAR_RANGE, plus the document year when it falls outside.
 * @param {number} currentYear - Year of today
 * @param {number} selectedYear - Year of the document
 * @returns {SelectOption<number>[]} - Ascending options
 */
export const getYearOptions = (currentYear: number, selectedYear: number): SelectOption<number>[] => {
  const years = new Set<number>([selectedYear]);

  for (let year = currentYear - YEAR_RANGE; year <= currentYear + YEAR_RANGE; year += 1) {
    years.add(year);
  }

  return [...years].sort((a, b) => a - b).map((year) => ({ value: year, label: String(year) }));
};
