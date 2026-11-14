import { fireEvent, render, screen } from "@/libs/unit-test";

import BulkFillComponent from "./BulkFill.component";
import type { BulkFillProps } from "./BulkFill.type";

/**
 * Build component props.
 * @param {Partial<BulkFillProps>} [overrides] - Prop overrides
 * @returns {BulkFillProps} - Props
 */
const makeProps = (overrides?: Partial<BulkFillProps>): BulkFillProps => ({
  values: { from: "2026-10-01", to: "2026-10-02", task: "", start: "08:00", end: "17:00", skipFilled: true },
  dateOptions: [
    { value: "2026-10-01", label: "Kam, 01/10/2026" },
    { value: "2026-10-02", label: "Jum, 02/10/2026" },
  ],
  taskOptions: [{ value: "Daily" }],
  targetCount: 2,
  error: null,
  notice: null,
  onFieldChange: jest.fn(),
  onTaskChange: jest.fn(),
  onSkipFilledChange: jest.fn(),
  onSubmit: jest.fn(),
  ...overrides,
});

describe("BulkFillComponent", () => {
  it("should forward changes and submit", () => {
    const props = makeProps({ error: "Task wajib diisi.", notice: "2 aktivitas ditambahkan." });

    render(<BulkFillComponent {...props} />);
    fireEvent.change(screen.getByRole("combobox", { name: "Dari" }), { target: { value: "2026-10-02" } });
    fireEvent.change(screen.getByLabelText("Jam mulai massal"), { target: { value: "09:00" } });
    fireEvent.change(screen.getByRole("combobox", { name: "Task massal" }), { target: { value: "x" } });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Isi 2 hari kerja" }));

    expect(props.onFieldChange).toHaveBeenCalledTimes(2);
    expect(props.onTaskChange).toHaveBeenCalled();
    expect(props.onSkipFilledChange).toHaveBeenCalled();
    expect(props.onSubmit).toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Task wajib diisi.");
    expect(screen.getByRole("status")).toHaveTextContent("2 aktivitas ditambahkan.");
  });
});
