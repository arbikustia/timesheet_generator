import { fireEvent, renderWithStore, screen } from "@/libs/unit-test";
import { createEmptyDoc } from "@/libs/utils/timesheet-document.util";

import { selectDoc } from "@/store/timesheet.slice";

import TimesheetBuilderContainer from "./TimesheetBuilder.container";

describe("TimesheetBuilderContainer", () => {
  it("should add an activity and show it in the list and the live preview", () => {
    const { store } = renderWithStore(<TimesheetBuilderContainer />, { timesheet: { doc: createEmptyDoc({ year: 2026, month: 10 }) } });

    fireEvent.change(screen.getByRole("combobox", { name: "Task" }), { target: { value: "Daily standup" } });
    fireEvent.submit(screen.getByRole("form", { name: "Tambah aktivitas" }));

    expect(selectDoc(store.getState()).entries).toHaveLength(1);
    expect(screen.getByText("Daftar aktivitas (1)")).toBeInTheDocument();
    expect(screen.getByText("Daily standup", { selector: "td" })).toBeInTheDocument();
  });

  it("should switch to the settings tab", () => {
    renderWithStore(<TimesheetBuilderContainer />);

    fireEvent.click(screen.getByRole("tab", { name: "Pengaturan" }));

    expect(screen.getByLabelText("Vendor Name")).toBeInTheDocument();
  });
});
