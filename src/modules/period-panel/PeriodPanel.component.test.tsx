import { fireEvent, render, screen } from "@/libs/unit-test";

import PeriodPanelComponent from "./PeriodPanel.component";
import type { PeriodPanelProps } from "./PeriodPanel.type";
import { getMonthOptions, getYearOptions } from "./PeriodPanel.util";

/**
 * Build component props.
 * @param {Partial<PeriodPanelProps>} [overrides] - Prop overrides
 * @returns {PeriodPanelProps} - Props
 */
const makeProps = (overrides?: Partial<PeriodPanelProps>): PeriodPanelProps => ({
  month: 10,
  year: 2026,
  monthOptions: getMonthOptions(),
  yearOptions: getYearOptions(2026, 2026),
  nextPeriodLabel: "November 2026",
  pendingAction: null,
  onMonthChange: jest.fn(),
  onYearChange: jest.fn(),
  onStartNextMonth: jest.fn(),
  onConfirmMove: jest.fn(),
  onConfirmReset: jest.fn(),
  onConfirmNextMonth: jest.fn(),
  onCancel: jest.fn(),
  ...overrides,
});

describe("PeriodPanelComponent", () => {
  it("should show the selected month and year and start the next month", () => {
    const props = makeProps();

    render(<PeriodPanelComponent {...props} />);

    expect(screen.getByText("Oktober")).toBeInTheDocument();
    expect(screen.getByText("2026")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Mulai November 2026" }));
    expect(props.onStartNextMonth).toHaveBeenCalled();
  });

  it("should open the confirmation dialog for a pending change", () => {
    render(<PeriodPanelComponent {...makeProps({ pendingAction: { kind: "change-period", period: { year: 2026, month: 11 } } })} />);

    expect(screen.getByRole("dialog")).toHaveTextContent("Periode diganti ke November 2026");
    expect(screen.getByRole("button", { name: "Pindahkan tanggal" })).toBeInTheDocument();
  });
});
