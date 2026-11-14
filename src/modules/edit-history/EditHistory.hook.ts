import { useCallback } from "react";

import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

import type { EditHistoryProps } from "./EditHistory.type";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { redo, selectCanRedo, selectCanUndo, undo } from "@/store/timesheet.slice";

/**
 * Undo/redo of document edits, with Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z and Ctrl/Cmd+Y.
 * @returns {EditHistoryProps} - Availability and handlers
 */
export const useEditHistory = (): EditHistoryProps => {
  const dispatch = useAppDispatch();
  const canUndo = useAppSelector(selectCanUndo);
  const canRedo = useAppSelector(selectCanRedo);

  /**
   * Revert the last edit.
   * @returns {void}
   */
  const handleUndo = useCallback((): void => {
    dispatch(undo());
  }, [dispatch]);

  /**
   * Re-apply the last undone edit.
   * @returns {void}
   */
  const handleRedo = useCallback((): void => {
    dispatch(redo());
  }, [dispatch]);

  useKeyboardShortcuts({ "mod+z": handleUndo, "mod+shift+z": handleRedo, "mod+y": handleRedo });

  return { canUndo, canRedo, onUndo: handleUndo, onRedo: handleRedo };
};
