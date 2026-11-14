import { type MouseEvent, useCallback, useMemo } from "react";

import type { ValidationTarget } from "@/types/timesheet-validation.type";

import type { ExportCheckProps } from "./ExportCheck.type";
import { buildSummaryItems } from "./ExportCheck.util";

import { useAppSelector } from "@/store/hooks";
import { selectValidationReport } from "@/store/timesheet.slice";

/**
 * Export check of the store document; clicking an item navigates to what it points at.
 * @param {(target: ValidationTarget) => void} onNavigate - Navigation handler
 * @returns {ExportCheckProps} - View props
 */
export const useExportCheck = (onNavigate: (target: ValidationTarget) => void): ExportCheckProps => {
  const report = useAppSelector(selectValidationReport);
  const summaryItems = useMemo(() => buildSummaryItems(report.summary), [report.summary]);
  const errors = useMemo(() => report.issues.filter((issue) => issue.level === "error"), [report.issues]);
  const warnings = useMemo(() => report.issues.filter((issue) => issue.level === "warning"), [report.issues]);

  /**
   * Navigate to the target of the clicked item (`data-issue-id`).
   * @param {MouseEvent<HTMLElement>} event - Click event
   * @returns {void}
   */
  const handleIssueClick = useCallback(
    (event: MouseEvent<HTMLElement>): void => {
      const issue = report.issues.find((item) => item.id === event.currentTarget.dataset.issueId);

      if (issue?.target) {
        onNavigate(issue.target);
      }
    },
    [report.issues, onNavigate],
  );

  return { summaryItems, errors, warnings, onIssueClick: handleIssueClick };
};
