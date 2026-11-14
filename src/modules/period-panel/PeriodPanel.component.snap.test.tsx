import test from "@/libs/unit-test";

import PeriodPanelComponent from "./PeriodPanel.component";
import { getMonthOptions, getYearOptions } from "./PeriodPanel.util";

const BASE_PROPS = {
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
};

describe("PeriodPanelComponent Snapshot Test", () => {
  test.assertSnapshots(PeriodPanelComponent, [{ desc: "should render the October 2026 period", props: BASE_PROPS }]);
});
