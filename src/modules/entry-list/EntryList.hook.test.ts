import { act, createStoreWrapper, renderHook } from "@/libs/unit-test";

import { loadOctoberDoc, makeDocStore } from "@/fixture/timesheet.fixture";

import { buildEntryRows, useEntryList } from "./EntryList.hook";

describe("buildEntryRows", () => {
  it("should keep list order and flag entries outside the period", () => {
    const doc = loadOctoberDoc();

    doc.entries[1] = { ...doc.entries[1], date: "2026-11-02", remarkOverride: "Manual" };

    const rows = buildEntryRows(doc);

    expect(rows).toHaveLength(23);
    expect(rows[0]).toMatchObject({ index: 0, isOutsidePeriod: false, remarkText: "" });
    expect(rows[1]).toMatchObject({ index: 1, isOutsidePeriod: true, remarkText: "Manual" });
  });
});

describe("useEntryList", () => {
  it("should expose rows, date options and an idle drag state", () => {
    const { result } = renderHook(() => useEntryList(), { wrapper: createStoreWrapper(makeDocStore()) });

    expect(result.current.rows).toHaveLength(23);
    expect(result.current.dateOptions).toHaveLength(31);
    expect(result.current.dragIndex).toBeNull();

    act(() => result.current.onDragEnd());
    expect(result.current.dragIndex).toBeNull();
  });
});
