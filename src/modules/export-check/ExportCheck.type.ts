import type { MouseEvent } from "react";

import type { ValidationIssue, ValidationTarget } from "@/types/timesheet-validation.type";

/** One statistic of the month summary. */
export type SummaryItem = {
  key: "workdays" | "hours" | "entries" | "evidence";
  label: string;
  value: string;
};

export type ExportCheckContainerProps = {
  /** Scroll/focus the place a check item points at. */
  onNavigate: (target: ValidationTarget) => void;
};

export type ExportCheckProps = {
  summaryItems: SummaryItem[];
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  infos: ValidationIssue[];
  onIssueClick: (event: MouseEvent<HTMLElement>) => void;
};

export type CheckStatusType = "error" | "warning" | "success";
