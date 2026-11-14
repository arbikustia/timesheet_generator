import { makeStore } from "@/store";
import {
  addEntry,
  getHistoryMergeKey,
  loadDoc,
  markSaved,
  redo,
  removeEntry,
  restoreDraft,
  selectCanRedo,
  selectCanUndo,
  selectDoc,
  selectIsDirty,
  selectValidationReport,
  undo,
  updateDefaultHours,
  updateEntry,
  updateProfile,
} from "@/store/timesheet.slice";

import { loadOctoberDoc } from "@/fixture/timesheet.fixture";

const NEW_ENTRY = { date: "2026-10-30", task: "Rapat", start: "08:00", end: "17:00" };

describe("timesheet slice history", () => {
  it("should undo and redo edits and track the dirty state", () => {
    const store = makeStore();

    store.dispatch(loadDoc(loadOctoberDoc()));
    expect(selectCanUndo(store.getState())).toBe(false);

    store.dispatch(addEntry(NEW_ENTRY));
    expect(selectIsDirty(store.getState())).toBe(true);
    expect(selectCanUndo(store.getState())).toBe(true);

    store.dispatch(undo());
    expect(selectDoc(store.getState()).entries.some((entry) => entry.task === "Rapat")).toBe(false);
    expect(selectIsDirty(store.getState())).toBe(false);
    expect(selectCanRedo(store.getState())).toBe(true);

    store.dispatch(redo());
    expect(selectDoc(store.getState()).entries.some((entry) => entry.task === "Rapat")).toBe(true);
    expect(selectCanRedo(store.getState())).toBe(false);
  });

  it("should group typing in one field into a single undo step", () => {
    const store = makeStore();

    store.dispatch(loadDoc(loadOctoberDoc()));

    const { id, task } = selectDoc(store.getState()).entries[0];

    store.dispatch(updateEntry({ id, changes: { task: "A" } }));
    store.dispatch(updateEntry({ id, changes: { task: "AB" } }));
    store.dispatch(undo());

    expect(selectDoc(store.getState()).entries[0].task).toBe(task);
    expect(selectCanUndo(store.getState())).toBe(false);
  });

  it("should not record saving, no-op edits, loading or draft restore", () => {
    const store = makeStore();
    const doc = loadOctoberDoc();

    store.dispatch(loadDoc(doc));
    store.dispatch(removeEntry("missing"));
    store.dispatch(markSaved(selectDoc(store.getState())));
    expect(selectCanUndo(store.getState())).toBe(false);

    store.dispatch(addEntry(NEW_ENTRY));
    store.dispatch(restoreDraft(loadOctoberDoc()));
    expect(selectCanUndo(store.getState())).toBe(false);
    expect(selectIsDirty(store.getState())).toBe(true);
  });

  it("should build merge keys per edited field", () => {
    expect(getHistoryMergeKey(updateEntry({ id: "a", changes: { task: "x" } }))).toBe("entry:a:task");
    expect(getHistoryMergeKey(updateProfile({ squad: "x" }))).toBe("profile:squad");
    expect(getHistoryMergeKey(updateDefaultHours({ start: "09:00" }))).toBe("defaults:start");
    expect(getHistoryMergeKey(removeEntry("a"))).toBeNull();
  });

  it("should memoize the validation report per document", () => {
    const store = makeStore();

    store.dispatch(loadDoc(loadOctoberDoc()));

    const report = selectValidationReport(store.getState());

    expect(selectValidationReport(store.getState())).toBe(report);
    expect(report.summary.entryCount).toBeGreaterThan(0);
  });
});
