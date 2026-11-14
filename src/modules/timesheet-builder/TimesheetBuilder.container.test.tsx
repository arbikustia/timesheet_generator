import { createTimesheetState } from "@/store/timesheet.slice";
import { fireEvent, renderWithStore, screen, waitFor, within } from "@/libs/unit-test";
import { createEmptyDoc } from "@/libs/utils/timesheet-document.util";

import { selectDoc } from "@/store/timesheet.slice";

import { loadOctoberDoc } from "@/fixture/timesheet.fixture";

import TimesheetBuilderContainer from "./TimesheetBuilder.container";

describe("TimesheetBuilderContainer", () => {
  it("should add an activity and show it in the list and the live preview", () => {
    const { store } = renderWithStore(<TimesheetBuilderContainer />, { timesheet: createTimesheetState(createEmptyDoc({ year: 2026, month: 10 })) });

    fireEvent.change(screen.getByRole("combobox", { name: "Task" }), { target: { value: "Daily standup" } });
    fireEvent.submit(screen.getByRole("form", { name: "Tambah aktivitas" }));

    expect(selectDoc(store.getState()).entries).toHaveLength(1);
    expect(screen.getByText("Daftar aktivitas (1)")).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "Pratinjau dokumen" })).getByText("Daily standup", { selector: "td" })).toBeInTheDocument();
  });

  it("should switch to the settings tab", () => {
    renderWithStore(<TimesheetBuilderContainer />);

    fireEvent.click(screen.getByRole("tab", { name: "Pengaturan" }));

    expect(screen.getByLabelText("Vendor Name")).toBeInTheDocument();
  });

  it("should jump from a check item to the signature slot", async () => {
    renderWithStore(<TimesheetBuilderContainer />, { timesheet: createTimesheetState(loadOctoberDoc()) });

    // Text queries keep this full-page test fast; role queries over both A4 copies are slow under coverage.
    fireEvent.click(screen.getByText("Cek export"));
    fireEvent.click(screen.getByText("Tanda tangan Tribe Leader belum diunggah."));

    await waitFor(() => expect(document.activeElement).toHaveAttribute("id", "signature-tribeLeader"));
  }, 30_000);
});
