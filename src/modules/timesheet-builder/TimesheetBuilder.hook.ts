import { useCallback, useState } from "react";

import { formatPeriodLabelId } from "@/libs/utils/date.util";

import { BUILDER_TAB_LABELS } from "./TimesheetBuilder.config";
import type { BuilderTab, TimesheetBuilderProps } from "./TimesheetBuilder.type";

import { useAppSelector } from "@/store/hooks";
import { useTheme } from "@/store/theme.hook";
import { selectDoc } from "@/store/timesheet.slice";

/**
 * Whether a tab key is a known builder tab.
 * @param {string} key - Tab key from antd Tabs
 * @returns {boolean} - True for a builder tab
 */
export const isBuilderTab = (key: string): key is BuilderTab => {
  return Object.hasOwn(BUILDER_TAB_LABELS, key);
};

/**
 * Page shell state: active input tab, header texts and the UI theme toggle.
 * @returns {TimesheetBuilderProps} - Shell props
 */
export const useTimesheetBuilder = (): TimesheetBuilderProps => {
  const { period, profile } = useAppSelector(selectDoc);
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<BuilderTab>("activities");

  /**
   * Switch the input tab.
   * @param {string} key - Tab key
   * @returns {void}
   */
  const handleTabChange = useCallback((key: string): void => {
    if (isBuilderTab(key)) {
      setActiveTab(key);
    }
  }, []);

  return {
    activeTab,
    periodLabel: formatPeriodLabelId(period),
    consultantName: profile.consultantName,
    theme,
    onTabChange: handleTabChange,
    onToggleTheme: toggleTheme,
  };
};
