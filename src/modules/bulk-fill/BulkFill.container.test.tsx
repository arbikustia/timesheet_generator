import { fireEvent, renderWithStore, screen } from "@/libs/unit-test";
import { createEmptyDoc } from "@/libs/utils/timesheet-document.util";

import { selectDoc } from "@/store/timesheet.slice";

import { makeDocStore } from "@/fixture/timesheet.fixture";

import BulkFillContainer from "./BulkFill.container";

/**
 * Render the form with an empty October and two filled days.
 * @returns {ReturnType<typeof renderWithStore>["store"]} - Store
 */
const renderBulkFill = (): ReturnType<typeof renderWithStore>["store"] => {
  const doc = createEmptyDoc({ year: 2026, month: 10 });

  doc.entries = [{ id: "a", date: "2026-10-05", task: "Existing", start: "08:00", end: "17:00", remarkOverride: null, source: "manual", reviewed: true }];

  return renderWithStore(<BulkFillContainer />, makeDocStore(doc).getState()).store;
};

describe("BulkFillContainer", () => {
  it("should fill the empty working days of a range with one task", () => {
    const store = renderBulkFill();

    fireEvent.change(screen.getByRole("combobox", { name: "Dari" }), { target: { value: "2026-10-01" } });
    fireEvent.change(screen.getByRole("combobox", { name: "Sampai" }), { target: { value: "2026-10-07" } });
    expect(screen.getByRole("button", { name: "Isi 4 hari kerja" })).toBeInTheDocument();

    fireEvent.submit(screen.getByRole("form", { name: "Isi massal" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Task wajib diisi.");

    fireEvent.change(screen.getByRole("combobox", { name: "Task massal" }), { target: { value: "Sprint planning" } });
    fireEvent.change(screen.getByLabelText("Jam mulai massal"), { target: { value: "09:00" } });
    fireEvent.change(screen.getByLabelText("Jam selesai massal"), { target: { value: "18:00" } });
    fireEvent.submit(screen.getByRole("form", { name: "Isi massal" }));

    const added = selectDoc(store.getState()).entries.filter((entry) => entry.task === "Sprint planning");

    expect(added.map((entry) => entry.date)).toEqual(["2026-10-01", "2026-10-02", "2026-10-06", "2026-10-07"]);
    expect(added[0]).toMatchObject({ start: "09:00", end: "18:00" });
    expect(screen.getByRole("status")).toHaveTextContent("4 aktivitas ditambahkan.");
  });

  it("should include filled days when the skip option is off", () => {
    const store = renderBulkFill();

    fireEvent.change(screen.getByRole("combobox", { name: "Sampai" }), { target: { value: "2026-10-05" } });
    fireEvent.click(screen.getByRole("checkbox", { name: "Lewati tanggal yang sudah punya aktivitas" }));
    fireEvent.change(screen.getByRole("combobox", { name: "Task massal" }), { target: { value: "Bulk" } });
    fireEvent.submit(screen.getByRole("form", { name: "Isi massal" }));

    expect(selectDoc(store.getState()).entries.filter((entry) => entry.date === "2026-10-05")).toHaveLength(2);
  });
});
