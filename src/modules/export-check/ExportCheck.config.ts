import type { ValidationLevel } from "@/types/timesheet-validation.type";

/** Texts per severity: list title and the screen-reader prefix of each item. */
export const LEVEL_TEXTS: Record<ValidationLevel, { title: string; label: string }> = {
  error: { title: "Error", label: "Error" },
  warning: { title: "Peringatan", label: "Peringatan" },
  info: { title: "Info", label: "Info" },
};
