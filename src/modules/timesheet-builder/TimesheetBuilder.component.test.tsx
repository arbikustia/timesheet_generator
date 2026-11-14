import { createTimesheetState } from "@/store/timesheet.slice";
import { fireEvent, renderWithStore, screen } from "@/libs/unit-test";

import { loadOctoberDoc } from "@/fixture/timesheet.fixture";

import TimesheetBuilderComponent from "./TimesheetBuilder.component";
import type { TimesheetBuilderProps } from "./TimesheetBuilder.type";

/**
 * Build component props.
 * @param {Partial<TimesheetBuilderProps>} [overrides] - Prop overrides
 * @returns {TimesheetBuilderProps} - Props
 */
const makeProps = (overrides?: Partial<TimesheetBuilderProps>): TimesheetBuilderProps => ({
  activeTab: "activities",
  periodLabel: "Oktober 2026",
  consultantName: "Arbi Kustia",
  theme: "light",
  onTabChange: jest.fn(),
  onToggleTheme: jest.fn(),
  ...overrides,
});

describe("TimesheetBuilderComponent", () => {
  it("should render the top bar, input panel and preview", () => {
    const props = makeProps();

    renderWithStore(<TimesheetBuilderComponent {...props} />, { timesheet: createTimesheetState(loadOctoberDoc()) });

    expect(screen.getByText("Oktober 2026 · Arbi Kustia")).toBeInTheDocument();
    expect(screen.getByRole("form", { name: "Tambah aktivitas" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Pratinjau dokumen" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Pengaturan" }));
    fireEvent.click(screen.getByRole("button", { name: "Mode gelap" }));

    expect(props.onTabChange).toHaveBeenCalledWith("settings");
    expect(props.onToggleTheme).toHaveBeenCalled();
  });

  it("should show only the period without consultant and the light toggle in dark mode", () => {
    renderWithStore(<TimesheetBuilderComponent {...makeProps({ consultantName: "", theme: "dark", activeTab: "days" })} />);

    expect(screen.getByText("Oktober 2026")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mode terang" })).toBeInTheDocument();
    expect(screen.getByRole("form", { name: "Tandai hari khusus" })).toBeInTheDocument();
  });
});
