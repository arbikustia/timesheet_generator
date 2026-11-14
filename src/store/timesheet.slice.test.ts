import { makeStore } from "@/store";
import timesheetReducer, {
  addEntry,
  addEvidence,
  changePeriod,
  createInitialTimesheetState,
  duplicateEntry,
  loadDoc,
  moveEntry,
  removeEntry,
  removeEvidence,
  replaceEvidence,
  selectDoc,
  setDayOverride,
  setSignature,
  startNextMonth,
  swapEvidence,
  updateDefaultHours,
  updateEntry,
  updateProfile,
} from "@/store/timesheet.slice";

import { loadOctoberDoc, SAMPLE_IMAGE } from "@/fixture/timesheet.fixture";

/**
 * Store preloaded with the October fixture.
 * @returns {ReturnType<typeof makeStore>} - Store
 */
const makeOctoberStore = (): ReturnType<typeof makeStore> => {
  const store = makeStore();

  store.dispatch(loadDoc(loadOctoberDoc()));

  return store;
};

describe("timesheet slice", () => {
  it("should start with an empty document for the current month", () => {
    const state = createInitialTimesheetState(new Date(2026, 10, 14));

    expect(state.doc.period).toEqual({ year: 2026, month: 11 });
    expect(state.doc.entries).toEqual([]);
    expect(timesheetReducer(undefined, { type: "init" }).doc.schemaVersion).toBe(1);
  });

  it("should add a manual entry in date order", () => {
    const store = makeOctoberStore();

    store.dispatch(addEntry({ date: "2026-10-05", task: "Meeting", start: "09:00", end: "10:00" }));

    const entries = selectDoc(store.getState()).entries;
    const added = entries[3];

    expect(added).toMatchObject({ date: "2026-10-05", task: "Meeting", source: "manual", reviewed: true, remarkOverride: null });
    expect(added.id).toEqual(expect.any(String));
    expect(entries[2].date).toBe("2026-10-05");
  });

  it("should update, duplicate, move and remove entries", () => {
    const store = makeOctoberStore();

    store.dispatch(updateEntry({ id: "e1", changes: { task: "Changed", end: "18:00" } }));
    store.dispatch(updateEntry({ id: "missing", changes: { task: "Ignored" } }));
    store.dispatch(duplicateEntry("e1"));
    store.dispatch(duplicateEntry("missing"));

    let entries = selectDoc(store.getState()).entries;

    expect(entries[0]).toMatchObject({ id: "e1", task: "Changed", end: "18:00" });
    expect(entries[1]).toMatchObject({ task: "Changed", date: "2026-10-01" });
    expect(entries[1].id).not.toBe("e1");
    expect(entries).toHaveLength(24);

    store.dispatch(moveEntry({ fromIndex: 0, toIndex: 2 }));
    store.dispatch(removeEntry(entries[1].id));
    entries = selectDoc(store.getState()).entries;

    expect(entries.map((entry) => entry.id).slice(0, 2)).toEqual(["e2", "e1"]);
    expect(entries).toHaveLength(23);
  });

  it("should set and clear a day override", () => {
    const store = makeOctoberStore();

    store.dispatch(setDayOverride({ date: "2026-10-01", override: { type: "holiday", label: "Public Holiday" } }));
    expect(selectDoc(store.getState()).dayOverrides["2026-10-01"]).toEqual({ type: "holiday", label: "Public Holiday" });

    store.dispatch(setDayOverride({ date: "2026-10-01", override: null }));
    expect(selectDoc(store.getState()).dayOverrides).toEqual({});
  });

  it("should update profile, default hours and signatures", () => {
    const store = makeOctoberStore();

    store.dispatch(updateProfile({ squad: "Epics X", taskTemplates: ["Standup"] }));
    store.dispatch(updateDefaultHours({ start: "09:00" }));
    store.dispatch(setSignature({ key: "tribeLeader", dataUrl: "data:image/png;base64,AA" }));

    const { profile } = selectDoc(store.getState());

    expect(profile.squad).toBe("Epics X");
    expect(profile.taskTemplates).toEqual(["Standup"]);
    expect(profile.defaults).toEqual({ start: "09:00", end: "17:00" });
    expect(profile.signatures.tribeLeader).toBe("data:image/png;base64,AA");
  });

  it("should move or reset data when the period changes", () => {
    const store = makeOctoberStore();

    store.dispatch(changePeriod({ period: { year: 2026, month: 11 }, mode: "move" }));
    expect(selectDoc(store.getState()).entries[0].date).toBe("2026-11-01");

    store.dispatch(changePeriod({ period: { year: 2026, month: 12 }, mode: "reset" }));
    expect(selectDoc(store.getState()).entries).toEqual([]);
    expect(selectDoc(store.getState()).period).toEqual({ year: 2026, month: 12 });
  });

  it("should start the next month keeping the profile", () => {
    const store = makeOctoberStore();

    store.dispatch(startNextMonth());

    const doc = selectDoc(store.getState());

    expect(doc.period).toEqual({ year: 2026, month: 11 });
    expect(doc.entries).toEqual([]);
    expect(doc.profile.consultantName).toBe("Arbi Kustia");
  });
});

describe("evidence actions", () => {
  const left = { ...SAMPLE_IMAGE, id: "l" };
  const right = { ...SAMPLE_IMAGE, id: "r" };

  it("should add up to two images per date", () => {
    const store = makeOctoberStore();

    [left, right, { ...SAMPLE_IMAGE, id: "x" }].forEach((image) => store.dispatch(addEvidence({ date: "2026-10-01", image })));

    expect(selectDoc(store.getState()).evidence["2026-10-01"].map((image) => image.id)).toEqual(["l", "r"]);
  });

  it("should swap, replace and remove images", () => {
    const store = makeOctoberStore();
    const ids = (): string[] | undefined => selectDoc(store.getState()).evidence["2026-10-01"]?.map((image) => image.id);

    store.dispatch(addEvidence({ date: "2026-10-01", image: left }));
    store.dispatch(swapEvidence("2026-10-01"));
    expect(ids()).toEqual(["l"]);

    store.dispatch(addEvidence({ date: "2026-10-01", image: right }));
    store.dispatch(swapEvidence("2026-10-01"));
    expect(ids()).toEqual(["r", "l"]);

    store.dispatch(replaceEvidence({ date: "2026-10-01", id: "r", image: { ...SAMPLE_IMAGE, id: "n" } }));
    expect(ids()).toEqual(["n", "l"]);

    store.dispatch(removeEvidence({ date: "2026-10-01", id: "n" }));
    expect(ids()).toEqual(["l"]);

    store.dispatch(removeEvidence({ date: "2026-10-01", id: "l" }));
    expect(selectDoc(store.getState()).evidence).toEqual({});

    store.dispatch(replaceEvidence({ date: "2026-10-09", id: "z", image: left }));
    store.dispatch(removeEvidence({ date: "2026-10-09", id: "z" }));
    expect(selectDoc(store.getState()).evidence).toEqual({});
  });
});
