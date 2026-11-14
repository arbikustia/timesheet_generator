import { createTimesheetState } from "@/store/timesheet.slice";
import { fireEvent, renderWithStore, screen } from "@/libs/unit-test";
import { createEmptyDoc } from "@/libs/utils/timesheet-document.util";

import { selectDoc } from "@/store/timesheet.slice";

import EntryFormContainer from "./EntryForm.container";

describe("EntryFormContainer", () => {
  it("should add an activity when Enter submits the form", () => {
    const { store } = renderWithStore(<EntryFormContainer />, { timesheet: createTimesheetState(createEmptyDoc({ year: 2026, month: 10 })) });

    fireEvent.change(screen.getByRole("combobox", { name: "Task" }), { target: { value: "Daily standup" } });
    fireEvent.submit(screen.getByRole("form", { name: "Tambah aktivitas" }));

    expect(selectDoc(store.getState()).entries).toHaveLength(1);
    expect(selectDoc(store.getState()).entries[0]).toMatchObject({ date: "2026-10-01", task: "Daily standup" });
  });
});
