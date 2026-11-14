import { useCallback, useMemo, useState } from "react";

import { getPdfFileTitle } from "@/libs/utils/timesheet-document.util";

import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { usePrintTitle } from "@/hooks/usePrintTitle";

import type { ValidationIssue } from "@/types/timesheet-validation.type";

import { MAX_LISTED_ERRORS, POPUP_BLOCKED_MESSAGE } from "./ExportPdf.config";
import type { ExportPdfProps } from "./ExportPdf.type";
import { openDocumentInNewTab } from "./ExportPdf.util";

import { useAppSelector } from "@/store/hooks";
import { selectDoc, selectValidationReport } from "@/store/timesheet.slice";

/**
 * Messages of the errors that block the export (the first few).
 * @param {ValidationIssue[]} issues - Check items
 * @returns {string[]} - Messages
 */
export const getBlockingMessages = (issues: ValidationIssue[]): string[] => {
  return issues
    .filter((issue) => issue.level === "error")
    .map((issue) => issue.message)
    .slice(0, MAX_LISTED_ERRORS);
};

/**
 * "Buka di tab baru": the rendered document in a separate tab (a preview; no export check needed).
 * @param {string} title - Tab title
 * @returns {Pick<ExportPdfProps, "tabError" | "onOpenTab">} - Error of the last attempt and the handler
 */
export const usePreviewTab = (title: string): Pick<ExportPdfProps, "tabError" | "onOpenTab"> => {
  const [tabError, setTabError] = useState<string | null>(null);

  /**
   * Open the tab, or explain that the pop-up was blocked.
   * @returns {void}
   */
  const handleOpenTab = (): void => {
    setTabError(openDocumentInNewTab(document.querySelector(".print-root"), title) ? null : POPUP_BLOCKED_MESSAGE);
  };

  return { tabError, onOpenTab: handleOpenTab };
};

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
  const pdfTitle = getPdfFileTitle(doc);
  const errorMessages = useMemo(() => getBlockingMessages(report.issues), [report.issues]);

  usePrintTitle(pdfTitle);

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
    ...usePreviewTab(pdfTitle),
    onCloseBlocked: handleCloseBlocked,
    onShowCheck: handleShowCheck,
  };
};
