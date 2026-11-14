import { fireEvent, renderWithStore, screen } from "@/libs/unit-test";

import { selectDoc } from "@/store/timesheet.slice";

import { loadOctoberDoc } from "@/fixture/timesheet.fixture";

import EntryListContainer from "./EntryList.container";

/**
 * Render the list with the first three October entries.
 * @returns {ReturnType<typeof renderWithStore>["store"]} - Store
 */
const renderList = (): ReturnType<typeof renderWithStore>["store"] => {
  const doc = loadOctoberDoc();

  doc.entries = doc.entries.slice(0, 3);

  return renderWithStore(<EntryListContainer />, { timesheet: { doc } }).store;
};

describe("EntryListContainer", () => {
  it("should edit task, date, time and remark inline", () => {
    const store = renderList();

    fireEvent.change(screen.getAllByRole("textbox", { name: "Task" })[0], { target: { value: "Updated task" } });
    fireEvent.change(screen.getAllByRole("combobox", { name: "Tanggal aktivitas" })[0], { target: { value: "2026-10-06" } });
    fireEvent.change(screen.getAllByLabelText("Selesai")[0], { target: { value: "18:00" } });
    fireEvent.change(screen.getAllByRole("textbox", { name: "Remark manual" })[0], { target: { value: "Foto / Screenshot" } });

    expect(selectDoc(store.getState()).entries[0]).toMatchObject({
      task: "Updated task",
      date: "2026-10-06",
      end: "18:00",
      remarkOverride: "Foto / Screenshot",
    });

    fireEvent.change(screen.getAllByRole("textbox", { name: "Remark manual" })[0], { target: { value: "  " } });
    expect(selectDoc(store.getState()).entries[0].remarkOverride).toBeNull();
  });

  it("should duplicate and remove entries", () => {
    const store = renderList();

    fireEvent.click(screen.getAllByRole("button", { name: "Duplikat" })[0]);
    expect(selectDoc(store.getState()).entries).toHaveLength(4);

    fireEvent.click(screen.getAllByRole("button", { name: "Hapus" })[0]);
    expect(selectDoc(store.getState()).entries).toHaveLength(3);
  });

  it("should reorder with the move buttons and drag and drop", () => {
    const store = renderList();
    const ids = (): string[] => selectDoc(store.getState()).entries.map((entry) => entry.id);

    fireEvent.click(screen.getAllByRole("button", { name: "Turunkan" })[0]);
    expect(ids()).toEqual(["e2", "e1", "e3"]);

    fireEvent.click(screen.getAllByRole("button", { name: "Naikkan" })[1]);
    expect(ids()).toEqual(["e1", "e2", "e3"]);

    const items = screen.getAllByRole("listitem");

    fireEvent.dragStart(items[0]);
    fireEvent.dragOver(items[2]);
    fireEvent.drop(items[2]);
    expect(ids()).toEqual(["e2", "e3", "e1"]);

    fireEvent.drop(items[0]);
    expect(ids()).toEqual(["e2", "e3", "e1"]);
  });
});
