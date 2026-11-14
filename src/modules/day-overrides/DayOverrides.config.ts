import type { SelectOption } from "@/types/common.type";
import type { DayOverrideType } from "@/types/timesheet.type";

/** Indonesian names of the day override types. */
export const DAY_OVERRIDE_TYPE_OPTIONS: SelectOption<DayOverrideType>[] = [
  { value: "holiday", label: "Libur nasional" },
  { value: "leave", label: "Cuti" },
];
