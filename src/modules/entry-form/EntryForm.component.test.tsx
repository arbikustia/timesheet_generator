import { fireEvent, render, screen } from "@/libs/unit-test";

import EntryFormComponent from "./EntryForm.component";
import type { EntryFormProps } from "./EntryForm.type";

/**
 * Build component props.
 * @param {Partial<EntryFormProps>} [overrides] - Prop overrides
 * @returns {EntryFormProps} - Props
 */
const makeProps = (overrides?: Partial<EntryFormProps>): EntryFormProps => ({
  values: { date: "2026-10-01", task: "Daily standup", start: "08:00", end: "17:00" },
  dateOptions: [{ value: "2026-10-01", label: "Kam, 01/10/2026" }],
  taskOptions: [{ value: "Daily standup" }],
  error: null,
  canDuplicate: true,
  taskInputRef: { current: null },
  onDateChange: jest.fn(),
  onTaskChange: jest.fn(),
  onStartChange: jest.fn(),
  onEndChange: jest.fn(),
  onDuplicatePrevious: jest.fn(),
  onSubmit: jest.fn((event) => event.preventDefault()),
  ...overrides,
});

describe("EntryFormComponent", () => {
  it("should show values and submit on Tambah", () => {
    const props = makeProps();

    render(<EntryFormComponent {...props} />);

    expect(screen.getByText("Kam, 01/10/2026")).toBeInTheDocument();
    expect(screen.getByLabelText("Jam mulai")).toHaveValue("08:00");

    fireEvent.change(screen.getByLabelText("Jam selesai"), { target: { value: "18:00" } });
    fireEvent.click(screen.getByRole("button", { name: "Duplikat sebelumnya" }));
    fireEvent.click(screen.getByRole("button", { name: "Tambah" }));

    expect(props.onEndChange).toHaveBeenCalled();
    expect(props.onDuplicatePrevious).toHaveBeenCalled();
    expect(props.onSubmit).toHaveBeenCalled();
  });

  it("should show the error and disable duplicate without a previous entry", () => {
    render(<EntryFormComponent {...makeProps({ error: "Task wajib diisi.", canDuplicate: false })} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Task wajib diisi.");
    expect(screen.getByRole("button", { name: "Duplikat sebelumnya" })).toBeDisabled();
  });
});
