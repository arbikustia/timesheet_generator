import { type ChangeEvent, useRef, useState } from "react";

import { readInputFile } from "@/libs/utils/file-system.util";
import { parseTimesheetDoc } from "@/libs/utils/timesheet-document.util";
import { mergePreviousMonth } from "@/libs/utils/workflow.util";

import type { ImportNotice, PreviousMonthImportProps } from "./PreviousMonthImport.type";
import { describePreviousImport } from "./PreviousMonthImport.util";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { importPreviousMonth, selectDoc } from "@/store/timesheet.slice";

/**
 * "Impor dari bulan lalu" (PROMPT §7): read last month's file locally and take over its profile, signatures,
 * task list and automation settings, filling only what is still empty. The file is only read, never changed.
 * @returns {PreviousMonthImportProps} - View props
 */
export const usePreviousMonthImport = (): PreviousMonthImportProps => {
  const dispatch = useAppDispatch();
  const doc = useAppSelector(selectDoc);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isReading, setIsReading] = useState<boolean>(false);
  const [notice, setNotice] = useState<ImportNotice | null>(null);

  /**
   * Validate the chosen file and merge it.
   * @param {File} file - Previous month's document
   * @returns {Promise<void>} - Resolves when done
   */
  const importFile = async (file: File): Promise<void> => {
    setIsReading(true);

    try {
      const result = parseTimesheetDoc((await readInputFile(file)).text);

      if (!result.isOk) {
        setNotice({ type: "error", text: `Gagal membaca ${file.name}: ${result.message}` });

        return;
      }

      setNotice(describePreviousImport(mergePreviousMonth(doc, result.doc).summary, result.doc.period));
      dispatch(importPreviousMonth(result.doc));
    } finally {
      setIsReading(false);
    }
  };

  /**
   * Open the file chooser.
   * @returns {void}
   */
  const handleChooseFile = (): void => fileInputRef.current?.click();

  /**
   * Import the chosen file.
   * @param {ChangeEvent<HTMLInputElement>} event - Change event
   * @returns {void}
   */
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const input = event.currentTarget;
    const file = input.files?.[0];

    input.value = "";

    if (file) {
      void importFile(file);
    }
  };

  return { fileInputRef, isReading, notice, onChooseFile: handleChooseFile, onFileChange: handleFileChange };
};
