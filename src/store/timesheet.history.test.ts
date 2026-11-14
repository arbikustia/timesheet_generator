import { HISTORY_LIMIT, recordHistory, redoHistory, undoHistory } from "@/store/timesheet.history";
import { createTimesheetState } from "@/store/timesheet.slice";
import type { TimesheetState } from "@/store/timesheet.type";
import { createEmptyDoc } from "@/libs/utils/timesheet-document.util";

import type { TimesheetDoc } from "@/types/timesheet.type";

/**
 * A distinct document for the given month.
 * @param {number} month - 1-based month
 * @returns {TimesheetDoc} - Document
 */
const docOf = (month: number): TimesheetDoc => createEmptyDoc({ year: 2026, month });

/**
 * State after applying an edit that replaces the document.
 * @param {TimesheetState} state - Previous state
 * @param {TimesheetDoc} doc - New document
 * @param {string | null} mergeKey - Merge key
 * @returns {TimesheetState} - Next state
 */
const edit = (state: TimesheetState, doc: TimesheetDoc, mergeKey: string | null): TimesheetState =>
  recordHistory(state, { ...state, doc }, mergeKey);

describe("timesheet history", () => {
  it("should push the previous document and clear redo", () => {
    const first = docOf(1);
    const state = edit({ ...createTimesheetState(first), future: [docOf(9)] }, docOf(2), null);

    expect(state.past).toEqual([first]);
    expect(state.future).toEqual([]);
  });

  it("should merge consecutive edits with the same key only", () => {
    let state = createTimesheetState(docOf(1));

    state = edit(state, docOf(2), "entry:a:task");
    state = edit(state, docOf(3), "entry:a:task");
    expect(state.past).toHaveLength(1);

    state = edit(state, docOf(4), "entry:b:task");
    state = edit(state, docOf(5), null);
    state = edit(state, docOf(6), null);
    expect(state.past).toHaveLength(4);
  });

  it("should cap the undo stack", () => {
    let state = createTimesheetState(docOf(1));

    for (let index = 0; index < HISTORY_LIMIT + 5; index += 1) {
      state = edit(state, docOf((index % 12) + 1), null);
    }

    expect(state.past).toHaveLength(HISTORY_LIMIT);
  });

  it("should undo and redo, and do nothing at the ends", () => {
    const first = docOf(1);
    const second = docOf(2);
    const start = createTimesheetState(first);

    expect(undoHistory(start)).toBe(start);
    expect(redoHistory(start)).toBe(start);

    const undone = undoHistory(edit(start, second, "k"));

    expect(undone.doc).toBe(first);
    expect(undone.future).toEqual([second]);
    expect(undone.mergeKey).toBeNull();

    const redone = redoHistory(undone);

    expect(redone.doc).toBe(second);
    expect(redone.past).toEqual([first]);
  });
});
