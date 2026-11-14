import { useCallback, useEffect, useState } from "react";

import { formatPeriodLabelId } from "@/libs/utils/date.util";

import type { ValidationTarget } from "@/types/timesheet-validation.type";

import { BUILDER_TAB_LABELS } from "./TimesheetBuilder.config";
import type { BuilderTab, NavigationPlan, TimesheetBuilderProps } from "./TimesheetBuilder.type";
import { applyNavigationPlan, getNavigationPlan } from "./TimesheetBuilder.util";

import { useAppSelector } from "@/store/hooks";
import { useTheme } from "@/store/theme.hook";
import { selectDoc, selectValidationReport } from "@/store/timesheet.slice";

/**
 * Whether a tab key is a known builder tab.
 * @param {string} key - Tab key from antd Tabs
 * @returns {boolean} - True for a builder tab
 */
export const isBuilderTab = (key: string): key is BuilderTab => {
  return Object.hasOwn(BUILDER_TAB_LABELS, key);
};

/**
 * Navigation from a check item: opens its tab, then focuses/scrolls to it after the tab has rendered.
 * @param {(tab: BuilderTab) => void} setActiveTab - Tab setter
 * @returns {(target: ValidationTarget) => void} - Navigation handler
 */
export const useCheckNavigation = (setActiveTab: (tab: BuilderTab) => void): ((target: ValidationTarget) => void) => {
  const [pendingPlan, setPendingPlan] = useState<NavigationPlan | null>(null);

  useEffect(() => {
    if (!pendingPlan) {
      return;
    }

    // Ant Design mounts a newly opened tab pane after this commit; wait one frame for it.
    const frame = window.requestAnimationFrame(() => applyNavigationPlan(pendingPlan));

    return (): void => window.cancelAnimationFrame(frame);
  }, [pendingPlan]);

  return useCallback(
    (target: ValidationTarget): void => {
      const plan = getNavigationPlan(target);

      setActiveTab(plan.tab);
      setPendingPlan(plan);
    },
    [setActiveTab],
  );
};

/**
 * Page shell state: active input tab, header texts, check counts, navigation and the UI theme toggle.
 * @returns {TimesheetBuilderProps} - Shell props
 */
export const useTimesheetBuilder = (): TimesheetBuilderProps => {
  const { period, profile } = useAppSelector(selectDoc);
  const { errorCount, warningCount } = useAppSelector(selectValidationReport);
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<BuilderTab>("activities");
  const handleNavigate = useCheckNavigation(setActiveTab);

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

  /**
   * Open the export check tab.
   * @returns {void}
   */
  const handleShowCheck = useCallback((): void => {
    setActiveTab("check");
  }, []);

  return {
    activeTab,
    periodLabel: formatPeriodLabelId(period),
    consultantName: profile.consultantName,
    theme,
    errorCount,
    warningCount,
    onTabChange: handleTabChange,
    onToggleTheme: toggleTheme,
    onNavigate: handleNavigate,
    onShowCheck: handleShowCheck,
  };
};
