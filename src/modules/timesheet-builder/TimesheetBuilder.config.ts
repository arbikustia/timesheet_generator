import type { BuilderTab, CountTone } from "./TimesheetBuilder.type";

/** Tab labels of the input panel (Indonesian UI). */
export const BUILDER_TAB_LABELS: Record<BuilderTab, string> = {
  activities: "Aktivitas",
  evidence: "Evidence",
  review: "Review",
  days: "Hari khusus",
  settings: "Pengaturan",
  check: "Cek export",
};

/** Pill colours of tab counts. */
export const COUNT_TONE_CLASSES: Record<CountTone, string> = {
  danger: "bg-danger-strong text-white",
  warning: "bg-warning-subtle text-warning-strong",
};
