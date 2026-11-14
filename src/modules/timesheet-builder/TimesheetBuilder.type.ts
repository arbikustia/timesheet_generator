import type { ValidationTarget } from "@/types/timesheet-validation.type";

import type { Theme } from "@/store/theme.type";

/** Tabs of the input panel. */
export type BuilderTab = "activities" | "evidence" | "review" | "days" | "settings" | "check";

/** Colour of a count pill in a tab label. */
export type CountTone = "danger" | "warning";

/** Where a check item leads: the tab to open, an element to focus and/or a preview row to scroll to. */
export type NavigationPlan = {
  tab: BuilderTab;
  anchorId: string | null;
  previewDate: string | null;
};

export type TimesheetBuilderProps = {
  activeTab: BuilderTab;
  periodLabel: string;
  consultantName: string;
  theme: Theme;
  errorCount: number;
  warningCount: number;
  /** Automatic entries waiting for review. */
  reviewCount: number;
  onTabChange: (key: string) => void;
  onToggleTheme: () => void;
  onNavigate: (target: ValidationTarget) => void;
  onShowCheck: () => void;
};
