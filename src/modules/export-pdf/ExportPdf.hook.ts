import { useCallback, useMemo, useState } from "react";

import { getPdfFileTitle } from "@/libs/utils/timesheet-document.util";

import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { usePrintTitle } from "@/hooks/usePrintTitle";

import { MAX_LISTED_ERRORS } from "./ExportPdf.config";
import type { ExportPdfProps } from "./ExportPdf.type";

import { useAppSelector } from "@/store/hooks";
import { selectDoc, selectValidationReport } from "@/store/timesheet.slice";

/**
 * Export to PDF through the browser print dialog (vector PDF, selectable text). Errors of the export
 * check block the export; Ctrl/Cmd+P goes through the same check.
 * @param {() => void} onShowCheck - Opens the export check tab
 * @returns {ExportPdfProps} - Export props
 */
export const useExportPdf = (onShowCheck: () => void): ExportPdfProps => {
  const doc = useAppSelector(selectDoc);
  const report = useAppSelector(selectValidationReport);
  const [isBlockedOpen, setIsBlockedOpen] = useState(false);
  const errorMessages = useMemo(
    () => report.issues.filter((issue) => issue.level === "error").map((issue) => issue.message).slice(0, MAX_LISTED_ERRORS),
    [report.issues],
  );

  usePrintTitle(getPdfFileTitle(doc));

  /**
   * Print the document, or explain why the export is blocked.
   * @returns {void}
   */
  const handleExport = useCallback((): void => {
    if (report.errorCount > 0) {
      setIsBlockedOpen(true);

      return;
    }

    window.print();
  }, [report.errorCount]);

  /**
   * Close the blocked dialog.
   * @returns {void}
   */
  const handleCloseBlocked = useCallback((): void => {
    setIsBlockedOpen(false);
  }, []);

  /**
   * Close the dialog and open the export check tab.
   * @returns {void}
   */
  const handleShowCheck = useCallback((): void => {
    setIsBlockedOpen(false);
    onShowCheck();
  }, [onShowCheck]);

  useKeyboardShortcuts({ "mod+p": handleExport });

  return {
    doc,
    printContainer: document.body,
    errorMessages,
    isBlockedOpen,
    onExport: handleExport,
    onCloseBlocked: handleCloseBlocked,
    onShowCheck: handleShowCheck,
  };
};
