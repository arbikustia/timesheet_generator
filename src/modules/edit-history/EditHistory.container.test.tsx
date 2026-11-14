import { act, fireEvent, renderWithStore, screen } from "@/libs/unit-test";

import { addEntry, selectDoc } from "@/store/timesheet.slice";

import { makeEmptyOctoberStore } from "@/fixture/timesheet.fixture";

import EditHistoryContainer from "./EditHistory.container";

describe("EditHistoryContainer", () => {
  it("should undo and redo an added activity", () => {
    const { store } = renderWithStore(<EditHistoryContainer />, makeEmptyOctoberStore().getState());

    expect(screen.getByRole("button", { name: "Urungkan" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Urungkan" }));
    act(() => {
      store.dispatch(addEntry({ date: "2026-10-01", task: "Rapat", start: "08:00", end: "17:00" }));
    });
    fireEvent.click(screen.getByRole("button", { name: "Urungkan" }));
    expect(selectDoc(store.getState()).entries).toHaveLength(0);

    fireEvent.click(screen.getByRole("button", { name: "Ulangi" }));
    expect(selectDoc(store.getState()).entries).toHaveLength(1);
  });
});
