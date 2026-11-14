import * as React from "react";
import { FiAlertTriangle, FiXCircle } from "react-icons/fi";

import type { ValidationIssue, ValidationLevel } from "@/types/timesheet-validation.type";

import { LEVEL_TEXTS } from "./ExportCheck.config";
import type { CheckStatusType, ExportCheckProps, SummaryItem } from "./ExportCheck.type";

const LEVEL_ICONS: Record<ValidationLevel, React.ReactElement> = {
  error: <FiXCircle aria-hidden className="mt-0.5 shrink-0 text-danger-strong" />,
  warning: <FiAlertTriangle aria-hidden className="mt-0.5 shrink-0 text-warning-strong" />,
};

/**
 * One statistic of the month summary.
 * @param {SummaryItem} item - Statistic
 * @returns {React.ReactElement} - Term/definition pair
 */
export const renderSummaryItem = (item: SummaryItem): React.ReactElement => (
  <div key={item.key} className="flex flex-col rounded-lg border border-border-default p-2">
    <dt className="text-xs text-text-secondary">{item.label}</dt>
    <dd className="m-0 text-base font-semibold">{item.value}</dd>
  </div>
);

/**
 * One check item; items with a target are buttons that jump to it.
 * @param {ValidationIssue} issue - Check item
 * @param {ExportCheckProps["onIssueClick"]} onIssueClick - Click handler
 * @returns {React.ReactElement} - List item
 */
export const renderIssue = (issue: ValidationIssue, onIssueClick: ExportCheckProps["onIssueClick"]): React.ReactElement => {
  const content = (
    <>
      {LEVEL_ICONS[issue.level]}
      <span>
        <span className="sr-only">{`${LEVEL_TEXTS[issue.level].label}: `}</span>
        {issue.message}
      </span>
    </>
  );

  return (
    <li key={issue.id}>
      {issue.target ? (
        <button
          type="button"
          className="flex w-full cursor-pointer items-start gap-2 rounded-md border-0 bg-transparent p-1.5 text-left text-sm text-text-primary hover:bg-background-subtle"
          data-issue-id={issue.id}
          onClick={onIssueClick}
        >
          {content}
        </button>
      ) : (
        <span className="flex items-start gap-2 p-1.5 text-sm">{content}</span>
      )}
    </li>
  );
};

/**
 * A titled list of check items of one level; nothing when empty.
 * @param {ValidationLevel} level - Severity
 * @param {ValidationIssue[]} issues - Items of that level
 * @param {ExportCheckProps["onIssueClick"]} onIssueClick - Click handler
 * @returns {React.ReactElement | null} - Section
 */
export const renderIssueGroup = (
  level: ValidationLevel,
  issues: ValidationIssue[],
  onIssueClick: ExportCheckProps["onIssueClick"],
): React.ReactElement | null => {
  if (issues.length === 0) {
    return null;
  }

  const titleId = `export-check-${level}`;

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-1">
      <h4 id={titleId} className="m-0 text-sm font-semibold">{`${LEVEL_TEXTS[level].title} (${issues.length})`}</h4>
      <ul className="m-0 flex list-none flex-col p-0">{issues.map((issue) => renderIssue(issue, onIssueClick))}</ul>
    </section>
  );
};

/**
 * Overall status of the check.
 * @param {number} errorCount - Number of errors
 * @param {number} warningCount - Number of warnings
 * @returns {string} - Status text
 */
export const getCheckStatusText = (errorCount: number, warningCount: number): string => {
  if (errorCount > 0) {
    return `${errorCount} error harus diperbaiki sebelum export PDF.`;
  }

  return warningCount > 0 ? `Siap export · ${warningCount} peringatan (tidak memblokir).` : "Semua beres — siap export PDF.";
};

/**
 * Alert type of the overall status.
 * @param {number} errorCount - Number of errors
 * @param {number} warningCount - Number of warnings
 * @returns {CheckStatusType} - Alert type
 */
export const getCheckStatusType = (errorCount: number, warningCount: number): CheckStatusType => {
  if (errorCount > 0) {
    return "error";
  }

  return warningCount > 0 ? "warning" : "success";
};
