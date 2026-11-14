import { useMemo } from "react";

import type { TimesheetDoc } from "@/types/timesheet.type";

import type { UseDocumentViewResult } from "./TimesheetDocument.type";
import { buildDocumentView } from "./TimesheetDocument.util";

/**
 * Derive the render-ready document view, recomputed only when the document changes.
 * @param {TimesheetDoc} doc - Parsed document
 * @returns {UseDocumentViewResult} - Document view
 */
export const useDocumentView = (doc: TimesheetDoc): UseDocumentViewResult => {
  const view = useMemo(() => buildDocumentView(doc), [doc]);

  return { view };
};
