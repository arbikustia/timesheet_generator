import { createTimesheetState } from "@/store/timesheet.slice";
import { fireEvent, renderWithStore, screen } from "@/libs/unit-test";

import { selectDoc } from "@/store/timesheet.slice";

import { loadOctoberDoc } from "@/fixture/timesheet.fixture";

import PeriodPanelContainer from "./PeriodPanel.container";

describe("PeriodPanelContainer", () => {
  it("should start the next month after confirmation", () => {
    const { store } = renderWithStore(<PeriodPanelContainer />, { timesheet: createTimesheetState(loadOctoberDoc()) });

    fireEvent.click(screen.getByRole("button", { name: "Mulai November 2026" }));
    fireEvent.click(screen.getByRole("button", { name: "Mulai bulan berikutnya" }));

    expect(selectDoc(store.getState()).period).toEqual({ year: 2026, month: 11 });
    expect(selectDoc(store.getState()).entries).toEqual([]);
  });
});
