import { makeStore } from "@/store";
import { addEntries, importPreviousMonth, loadDoc, selectCanUndo, selectDoc, undo } from "@/store/timesheet.slice";
import { createEmptyDoc } from "@/libs/utils/timesheet-document.util";

import { loadOctoberDoc } from "@/fixture/timesheet.fixture";

describe("timesheet slice — workflow", () => {
  it("should add many entries in date order as one undo step", () => {
    const store = makeStore();

    store.dispatch(loadDoc(loadOctoberDoc()));
    store.dispatch(
      addEntries([
        { date: "2026-10-20", task: "B", start: "08:00", end: "17:00" },
        { date: "2026-10-01", task: "A", start: "08:00", end: "17:00" },
      ]),
    );

    const entries = selectDoc(store.getState()).entries;

    expect(entries.findIndex((entry) => entry.task === "A")).toBeLessThan(entries.findIndex((entry) => entry.task === "B"));
    expect(entries.find((entry) => entry.task === "A")).toMatchObject({ source: "manual", reviewed: true, remarkOverride: null });

    store.dispatch(undo());
    expect(selectDoc(store.getState()).entries).toHaveLength(23);
    expect(selectCanUndo(store.getState())).toBe(false);
  });

  it("should import the previous month's profile", () => {
    const store = makeStore();

    store.dispatch(loadDoc(createEmptyDoc({ year: 2026, month: 11 })));
    store.dispatch(importPreviousMonth(loadOctoberDoc()));

    expect(selectDoc(store.getState()).profile.consultantName).toBe("Arbi Kustia");
    expect(selectCanUndo(store.getState())).toBe(true);
  });
});
