import type { TimesheetState } from "./timesheet.type";

/** Maximum number of undo steps kept in memory. */
export const HISTORY_LIMIT = 100;

/**
 * Record an edit: the previous document goes to the undo stack and the redo stack is cleared.
 * Consecutive edits with the same non-null merge key (e.g. typing in one field) form a single step.
 * @param {TimesheetState} previous - State before the edit
 * @param {TimesheetState} next - State after the edit
 * @param {string | null} mergeKey - Merge key of the edit
 * @returns {TimesheetState} - Next state with history
 */
export const recordHistory = (previous: TimesheetState, next: TimesheetState, mergeKey: string | null): TimesheetState => {
  if (mergeKey !== null && mergeKey === previous.mergeKey) {
    return { ...next, future: [], mergeKey };
  }

  return { ...next, past: [...previous.past, previous.doc].slice(-HISTORY_LIMIT), future: [], mergeKey };
};

/**
 * Step back to the previous document.
 * @param {TimesheetState} state - Current state
 * @returns {TimesheetState} - State after undo (unchanged when there is nothing to undo)
 */
export const undoHistory = (state: TimesheetState): TimesheetState => {
  const previous = state.past.at(-1);

  if (!previous) {
    return state;
  }

  return { ...state, doc: previous, past: state.past.slice(0, -1), future: [...state.future, state.doc], mergeKey: null };
};

/**
 * Re-apply the last undone document.
 * @param {TimesheetState} state - Current state
 * @returns {TimesheetState} - State after redo (unchanged when there is nothing to redo)
 */
export const redoHistory = (state: TimesheetState): TimesheetState => {
  const next = state.future.at(-1);

  if (!next) {
    return state;
  }

  return { ...state, doc: next, past: [...state.past, state.doc], future: state.future.slice(0, -1), mergeKey: null };
};
