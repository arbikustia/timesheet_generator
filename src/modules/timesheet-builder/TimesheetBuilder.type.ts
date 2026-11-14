import type { Theme } from "@/store/theme.type";

/** Tabs of the input panel. */
export type BuilderTab = "activities" | "days" | "settings";

export type TimesheetBuilderProps = {
  activeTab: BuilderTab;
  periodLabel: string;
  consultantName: string;
  theme: Theme;
  onTabChange: (key: string) => void;
  onToggleTheme: () => void;
};
