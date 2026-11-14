import { type ChangeEvent, type MouseEvent, useEffect, useMemo, useState } from "react";

import { COPIED_FEEDBACK_MS, UNSAVED_DOC_PLACEHOLDER } from "./ImportReview.config";
import type { ImportReviewProps, ReviewActions, ReviewWeek } from "./ImportReview.type";
import { buildImportCommand, buildReviewWeeks } from "./ImportReview.util";

import { selectFile } from "@/store/file.slice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { acceptEntries, mergeEntry, removeEntry, selectDoc, updateEntry } from "@/store/timesheet.slice";

/**
 * Copy text to the clipboard and flag success for a moment.
 * @param {string} text - Text to copy
 * @returns {Pick<ImportReviewProps, "isCopied" | "onCopyCommand">} - Feedback flag and handler
 */
export const useCopyText = (text: string): Pick<ImportReviewProps, "isCopied" | "onCopyCommand"> => {
  const [isCopied, setIsCopied] = useState<boolean>(false);

  useEffect(() => {
    if (!isCopied) {
      return undefined;
    }

    const timer = window.setTimeout(() => setIsCopied(false), COPIED_FEEDBACK_MS);

    return (): void => window.clearTimeout(timer);
  }, [isCopied]);

  /**
   * Copy the command.
   * @returns {void}
   */
  const handleCopy = (): void => {
    void navigator.clipboard?.writeText(text).then(() => setIsCopied(true));
  };

  return { isCopied, onCopyCommand: handleCopy };
};

/**
 * "Terima semua minggu ini".
 * @param {ReviewWeek[]} weeks - Current review weeks
 * @returns {ReviewActions["onAcceptWeek"]} - Handler (`data-week`)
 */
export const useAcceptWeek = (weeks: ReviewWeek[]): ReviewActions["onAcceptWeek"] => {
  const dispatch = useAppDispatch();

  /**
   * Accept every pending entry of a week.
   * @param {MouseEvent<HTMLElement>} event - Click event (`data-week`)
   * @returns {void}
   */
  const handleAcceptWeek = (event: MouseEvent<HTMLElement>): void => {
    const week = weeks.find((item) => item.key === event.currentTarget.dataset.week);

    if (week) {
      dispatch(acceptEntries(week.entryIds));
    }
  };

  return handleAcceptWeek;
};

/**
 * Accept, edit then accept, merge and reject handlers; targets come from `data-entry-id`.
 * @returns {Omit<ReviewActions, "onAcceptWeek">} - Handlers
 */
export const useReviewEntryActions = (): Omit<ReviewActions, "onAcceptWeek"> => {
  const dispatch = useAppDispatch();

  /**
   * Edit the task of an automatic entry before accepting it.
   * @param {ChangeEvent<HTMLInputElement>} event - Change event (`data-entry-id`)
   * @returns {void}
   */
  const handleTaskChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const id = event.currentTarget.dataset.entryId;

    if (id) {
      dispatch(updateEntry({ id, changes: { task: event.currentTarget.value } }));
    }
  };

  /**
   * Accept one entry.
   * @param {MouseEvent<HTMLElement>} event - Click event (`data-entry-id`)
   * @returns {void}
   */
  const handleAccept = (event: MouseEvent<HTMLElement>): void => {
    const id = event.currentTarget.dataset.entryId;

    if (id) {
      dispatch(acceptEntries([id]));
    }
  };

  /**
   * Reject (delete) one entry.
   * @param {MouseEvent<HTMLElement>} event - Click event (`data-entry-id`)
   * @returns {void}
   */
  const handleReject = (event: MouseEvent<HTMLElement>): void => {
    const id = event.currentTarget.dataset.entryId;

    if (id) {
      dispatch(removeEntry(id));
    }
  };

  /**
   * Merge an entry into the chosen row of the same date.
   * @param {ChangeEvent<HTMLSelectElement>} event - Change event (`data-entry-id`, value = target id)
   * @returns {void}
   */
  const handleMergeChange = (event: ChangeEvent<HTMLSelectElement>): void => {
    const sourceId = event.currentTarget.dataset.entryId;
    const targetId = event.currentTarget.value;

    if (sourceId && targetId) {
      dispatch(mergeEntry({ sourceId, targetId }));
    }
  };

  return {
    onTaskChange: handleTaskChange,
    onAccept: handleAccept,
    onReject: handleReject,
    onMergeChange: handleMergeChange,
  };
};

/**
 * Review of automatic entries (`reviewed: false`) plus the CLI command that imports them.
 * @returns {ImportReviewProps} - View props
 */
export const useImportReview = (): ImportReviewProps => {
  const doc = useAppSelector(selectDoc);
  const { fileName } = useAppSelector(selectFile);
  const weeks = useMemo(() => buildReviewWeeks(doc), [doc]);
  const importCommand = buildImportCommand(fileName ?? UNSAVED_DOC_PLACEHOLDER, doc.period);

  return {
    weeks,
    pendingCount: weeks.reduce((total, week) => total + week.entryIds.length, 0),
    snapshotCommand: "timesheet snapshot",
    importCommand,
    ...useCopyText(importCommand),
    ...useReviewEntryActions(),
    onAcceptWeek: useAcceptWeek(weeks),
  };
};
