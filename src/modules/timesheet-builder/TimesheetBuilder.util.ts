import {
  getEntryAnchorId,
  getEvidenceAnchorId,
  getPreviewRowSelector,
  getProfileFieldAnchorId,
  getSignatureAnchorId,
} from "@/libs/utils/anchor.util";

import type { ValidationTarget } from "@/types/timesheet-validation.type";

import type { NavigationPlan } from "./TimesheetBuilder.type";

/**
 * Where a check item leads. Dates also scroll the preview to their table row.
 * @param {ValidationTarget} target - Check item target
 * @returns {NavigationPlan} - Tab, element and preview row
 */
export const getNavigationPlan = (target: ValidationTarget): NavigationPlan => {
  switch (target.kind) {
    case "entry":
      return { tab: "activities", anchorId: getEntryAnchorId(target.entryId), previewDate: null };
    case "date":
      return { tab: "activities", anchorId: null, previewDate: target.date };
    case "evidence":
      return { tab: "evidence", anchorId: getEvidenceAnchorId(target.date), previewDate: target.date };
    case "profile":
      return { tab: "settings", anchorId: getProfileFieldAnchorId(target.field), previewDate: null };
    case "signature":
      return { tab: "settings", anchorId: getSignatureAnchorId(target.key), previewDate: null };
    default: {
      const exhaustive: never = target;

      return exhaustive;
    }
  }
};

/**
 * Scroll to and focus the element of a navigation plan, and scroll the preview to the date's row.
 * Missing elements are ignored (e.g. a date without a row).
 * @param {NavigationPlan} plan - Navigation plan
 * @param {Document} [root=document] - Document to search
 * @returns {void}
 */
export const applyNavigationPlan = (plan: NavigationPlan, root: Document = document): void => {
  const anchor = plan.anchorId ? root.getElementById(plan.anchorId) : null;
  const previewRow = plan.previewDate ? root.querySelector(getPreviewRowSelector(plan.previewDate)) : null;

  previewRow?.scrollIntoView({ block: "center", behavior: "smooth" });
  anchor?.scrollIntoView({ block: "center", behavior: "smooth" });

  if (anchor instanceof HTMLElement) {
    anchor.focus({ preventScroll: true });
  }
};
