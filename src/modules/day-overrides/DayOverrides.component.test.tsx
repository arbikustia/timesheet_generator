import { fireEvent, render, screen } from "@/libs/unit-test";

import DayOverridesComponent from "./DayOverrides.component";
import { DAY_OVERRIDE_TYPE_OPTIONS } from "./DayOverrides.config";
import type { DayOverridesProps } from "./DayOverrides.type";

/**
 * Build component props.
 * @param {Partial<DayOverridesProps>} [overrides] - Prop overrides
 * @returns {DayOverridesProps} - Props
 */
const makeProps = (overrides?: Partial<DayOverridesProps>): DayOverridesProps => ({
  values: { date: "2026-10-01", type: "holiday", label: "Public Holiday" },
  dateOptions: [{ value: "2026-10-01", label: "Kam, 01/10/2026" }],
  typeOptions: DAY_OVERRIDE_TYPE_OPTIONS,
  items: [],
  error: null,
  onDateChange: jest.fn(),
  onTypeChange: jest.fn(),
  onLabelChange: jest.fn(),
  onSubmit: jest.fn(),
  onRemove: jest.fn(),
  ...overrides,
});

describe("DayOverridesComponent", () => {
  it("should submit the form and edit the label", () => {
    const props = makeProps();

    render(<DayOverridesComponent {...props} />);

    fireEvent.change(screen.getByLabelText("Keterangan"), { target: { value: "Libur" } });
    fireEvent.click(screen.getByRole("button", { name: "Tandai" }));

    expect(props.onLabelChange).toHaveBeenCalled();
    expect(props.onSubmit).toHaveBeenCalled();
    expect(screen.queryByRole("list")).toBeNull();
  });

  it("should show the error and the marked days", () => {
    render(
      <DayOverridesComponent
        {...makeProps({
          error: "Keterangan wajib diisi.",
          items: [{ date: "2026-10-01", dateLabel: "Kam, 01/10/2026", override: { type: "holiday", label: "Public Holiday" }, hasEntries: false }],
        })}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Keterangan wajib diisi.");
    expect(screen.getByRole("list")).toHaveTextContent("Public Holiday");
  });
});
