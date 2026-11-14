import { makeStore } from "@/store";
import {
  acceptEntries,
  addRepo,
  getHistoryMergeKey,
  loadDoc,
  mergeEntry,
  removeRepo,
  removeTicketName,
  selectCanUndo,
  selectDoc,
  setTicketName,
  updateRepo,
} from "@/store/timesheet.slice";
import { createEmptyDoc } from "@/libs/utils/timesheet-document.util";

import type { Entry } from "@/types/timesheet.type";

const AUTO: Entry = {
  id: "auto",
  date: "2026-11-02",
  task: "BIT-231 – case transfer",
  start: "08:00",
  end: "17:00",
  remarkOverride: null,
  source: "git",
  reviewed: false,
  refs: { repo: "BANTUIT FE", branch: "BIT-231-case-transfer", ticket: "BIT-231", files: ["src/a.ts"], needsName: true },
};

/**
 * Store with a November document holding the given entries.
 * @param {Entry[]} entries - Entries
 * @returns {ReturnType<typeof makeStore>} - Store
 */
const makeReviewStore = (entries: Entry[]): ReturnType<typeof makeStore> => {
  const store = makeStore();
  const doc = createEmptyDoc({ year: 2026, month: 11 });

  doc.entries = entries;
  store.dispatch(loadDoc(doc));

  return store;
};

describe("timesheet slice — review", () => {
  it("should accept entries and learn the ticket name of a renamed one", () => {
    const store = makeReviewStore([{ ...AUTO, task: "Fixing case transfer" }, { ...AUTO, id: "other", task: "BIT-9 – login", refs: { ticket: "BIT-9", needsName: true } }]);

    store.dispatch(acceptEntries(["auto", "other", "missing"]));

    const doc = selectDoc(store.getState());

    expect(doc.entries.every((entry) => entry.reviewed)).toBe(true);
    expect(doc.entries[0].refs?.needsName).toBe(false);
    expect(doc.automation.ticketMap).toEqual({ "BIT-231": "Fixing case transfer" });
    expect(selectCanUndo(store.getState())).toBe(true);
  });

  it("should merge an automatic entry into another row of the same date only", () => {
    const manual: Entry = { ...AUTO, id: "manual", task: "Case transfer", source: "manual", reviewed: true, refs: undefined };
    const store = makeReviewStore([manual, AUTO, { ...AUTO, id: "later", date: "2026-11-03" }]);

    store.dispatch(mergeEntry({ sourceId: "later", targetId: "manual" }));
    store.dispatch(mergeEntry({ sourceId: "auto", targetId: "auto" }));
    expect(selectDoc(store.getState()).entries).toHaveLength(3);

    store.dispatch(mergeEntry({ sourceId: "auto", targetId: "manual" }));

    const { entries } = selectDoc(store.getState());

    expect(entries.map((entry) => entry.id)).toEqual(["manual", "later"]);
    expect(entries[0].refs?.files).toEqual(["src/a.ts"]);
  });

  it("should name tickets, rename pending entries and remove names", () => {
    const store = makeReviewStore([AUTO, { ...AUTO, id: "done", reviewed: true }]);

    store.dispatch(setTicketName({ ticket: " bit-231 ", name: " Fixing flow case transfer " }));

    let doc = selectDoc(store.getState());

    expect(doc.automation.ticketMap).toEqual({ "BIT-231": " Fixing flow case transfer " });
    expect(doc.entries.map((entry) => entry.task)).toEqual(["Fixing flow case transfer", "BIT-231 – case transfer"]);

    store.dispatch(setTicketName({ ticket: "", name: "x" }));
    store.dispatch(setTicketName({ ticket: "BIT-231", name: "" }));
    doc = selectDoc(store.getState());
    expect(doc.automation.ticketMap).toEqual({ "BIT-231": "" });

    store.dispatch(removeTicketName("bit-231"));
    expect(selectDoc(store.getState()).automation.ticketMap).toEqual({});
  });

  it("should add, edit and remove repositories", () => {
    const store = makeReviewStore([]);

    store.dispatch(addRepo());
    store.dispatch(updateRepo({ index: 0, changes: { path: "/work/fe", label: "FE" } }));
    store.dispatch(updateRepo({ index: 5, changes: { label: "none" } }));
    expect(selectDoc(store.getState()).automation.repos).toEqual([{ path: "/work/fe", label: "FE" }]);

    store.dispatch(removeRepo(3));
    store.dispatch(removeRepo(0));
    expect(selectDoc(store.getState()).automation.repos).toEqual([]);
  });

  it("should merge typing in a repo field or ticket name into one undo step", () => {
    expect(getHistoryMergeKey(updateRepo({ index: 1, changes: { label: "x" } }))).toBe("repo:1:label");
    expect(getHistoryMergeKey(setTicketName({ ticket: "bit-1", name: "x" }))).toBe("ticket:BIT-1");
  });
});
