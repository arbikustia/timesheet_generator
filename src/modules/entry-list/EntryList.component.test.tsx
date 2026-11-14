import { fireEvent, render, screen } from "@/libs/unit-test";

import { loadOctoberDoc } from "@/fixture/timesheet.fixture";

import EntryListComponent from "./EntryList.component";
import { buildEntryRows } from "./EntryList.hook";
import type { EntryListProps } from "./EntryList.type";

/**
 * Build component props.
 * @param {Partial<EntryListProps>} [overrides] - Prop overrides
 * @returns {EntryListProps} - Props
 */
const makeProps = (overrides?: Partial<EntryListProps>): EntryListProps => {
  const doc = loadOctoberDoc();

  doc.entries = doc.entries.slice(0, 2);

  return {
    rows: buildEntryRows(doc),
    dateOptions: [
      { value: "2026-10-01", label: "Kam, 01/10/2026" },
      { value: "2026-10-02", label: "Jum, 02/10/2026" },
    ],
    dragIndex: null,
    onFieldChange: jest.fn(),
    onRemarkChange: jest.fn(),
    onDuplicate: jest.fn(),
    onRemove: jest.fn(),
    onDragStart: jest.fn(),
    onDragOver: jest.fn(),
    onDrop: jest.fn(),
    onDragEnd: jest.fn(),
    onMoveUp: jest.fn(),
    onMoveDown: jest.fn(),
    ...overrides,
  };
};

describe("EntryListComponent", () => {
  it("should show an empty state", () => {
    render(<EntryListComponent {...makeProps({ rows: [] })} />);

    expect(screen.getByText(/Belum ada aktivitas/)).toBeInTheDocument();
  });

  it("should render rows with disabled edge move buttons and wire the callbacks", () => {
    const props = makeProps();

    render(<EntryListComponent {...props} />);

    const upButtons = screen.getAllByRole("button", { name: "Naikkan" });
    const downButtons = screen.getAllByRole("button", { name: "Turunkan" });

    expect(screen.getByText("Daftar aktivitas (2)")).toBeInTheDocument();
    expect(upButtons[0]).toBeDisabled();
    expect(downButtons[1]).toBeDisabled();

    fireEvent.click(upButtons[1]);
    fireEvent.click(screen.getAllByRole("button", { name: "Hapus" })[0]);
    fireEvent.dragStart(screen.getAllByRole("listitem")[0]);

    expect(props.onMoveUp).toHaveBeenCalled();
    expect(props.onRemove).toHaveBeenCalled();
    expect(props.onDragStart).toHaveBeenCalled();
  });

  it("should mark the dragged row and an entry outside the period", () => {
    const props = makeProps({ dragIndex: 0 });

    props.rows[1] = { ...props.rows[1], isOutsidePeriod: true, entry: { ...props.rows[1].entry, date: "2026-11-02" } };
    render(<EntryListComponent {...props} />);

    expect(screen.getAllByRole("listitem")[0]).toHaveClass("opacity-50");
    expect(screen.getByText("2026-11-02 (di luar periode)")).toBeInTheDocument();
  });
});
