import { createTimesheetState } from "@/store/timesheet.slice";
import { fireEvent, renderWithStore, screen } from "@/libs/unit-test";
import { createEmptyDoc } from "@/libs/utils/timesheet-document.util";

import { selectDoc } from "@/store/timesheet.slice";

import DayOverridesContainer from "./DayOverrides.container";

describe("DayOverridesContainer", () => {
  it("should mark and remove a holiday", () => {
    const { store } = renderWithStore(<DayOverridesContainer />, { timesheet: createTimesheetState(createEmptyDoc({ year: 2026, month: 10 })) });

    fireEvent.click(screen.getByRole("button", { name: "Tandai" }));
    expect(selectDoc(store.getState()).dayOverrides["2026-10-01"]).toEqual({ type: "holiday", label: "Public Holiday" });

    fireEvent.click(screen.getByRole("button", { name: "Hapus Kam, 01/10/2026" }));
    expect(selectDoc(store.getState()).dayOverrides).toEqual({});
  });
});
