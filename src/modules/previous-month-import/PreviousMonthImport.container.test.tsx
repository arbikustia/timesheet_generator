import { fireEvent, renderWithStore, screen } from "@/libs/unit-test";
import { createEmptyDoc, serializeTimesheetDoc } from "@/libs/utils/timesheet-document.util";

import { selectDoc } from "@/store/timesheet.slice";

import { loadOctoberDoc, makeDocStore } from "@/fixture/timesheet.fixture";

import PreviousMonthImportContainer from "./PreviousMonthImport.container";

/**
 * Render the importer with an empty November.
 * @returns {ReturnType<typeof renderWithStore>["store"]} - Store
 */
const renderImporter = (): ReturnType<typeof renderWithStore>["store"] =>
  renderWithStore(<PreviousMonthImportContainer />, makeDocStore(createEmptyDoc({ year: 2026, month: 11 })).getState()).store;

/**
 * Choose a file in the hidden input.
 * @param {string} text - File contents
 * @returns {void}
 */
const chooseFile = (text: string): void => {
  fireEvent.change(screen.getByLabelText("File dokumen bulan lalu"), { target: { files: [new File([text], "Timesheet-2026-10.json")] } });
};

describe("PreviousMonthImportContainer", () => {
  it("should take over last month's profile and tasks", async () => {
    const store = renderImporter();
    const click = jest.spyOn(HTMLInputElement.prototype, "click").mockImplementation(() => undefined);

    fireEvent.click(screen.getByRole("button", { name: "Pilih file bulan lalu…" }));
    expect(click).toHaveBeenCalled();

    chooseFile(serializeTimesheetDoc(loadOctoberDoc()));

    expect(await screen.findByRole("status")).toHaveTextContent("Dari Oktober 2026:");
    expect(selectDoc(store.getState()).profile.consultantName).toBe("Arbi Kustia");
    expect(selectDoc(store.getState()).period).toEqual({ year: 2026, month: 11 });

    chooseFile(serializeTimesheetDoc(loadOctoberDoc()));
    expect(await screen.findByText(/tidak ada yang perlu diambil/)).toBeInTheDocument();
    click.mockRestore();
  });

  it("should report an invalid file and ignore an empty selection", async () => {
    const store = renderImporter();

    fireEvent.change(screen.getByLabelText("File dokumen bulan lalu"), { target: { files: [] } });
    chooseFile("{ broken");

    expect(await screen.findByRole("alert")).toHaveTextContent("Gagal membaca Timesheet-2026-10.json");
    expect(selectDoc(store.getState()).profile.consultantName).toBe("");
  });
});
