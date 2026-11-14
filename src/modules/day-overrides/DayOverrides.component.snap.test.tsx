import test from "@/libs/unit-test";

import DayOverridesComponent from "./DayOverrides.component";
import { DAY_OVERRIDE_TYPE_OPTIONS } from "./DayOverrides.config";

const BASE_PROPS = {
  values: { date: "2026-10-01", type: "holiday" as const, label: "Public Holiday" },
  dateOptions: [{ value: "2026-10-01", label: "Kam, 01/10/2026" }],
  typeOptions: DAY_OVERRIDE_TYPE_OPTIONS,
  items: [],
  error: null,
  onDateChange: jest.fn(),
  onTypeChange: jest.fn(),
  onLabelChange: jest.fn(),
  onSubmit: jest.fn(),
  onRemove: jest.fn(),
};

describe("DayOverridesComponent Snapshot Test", () => {
  test.assertSnapshots(DayOverridesComponent, [
    { desc: "should render the empty form", props: BASE_PROPS },
    {
      desc: "should render a marked day",
      props: {
        ...BASE_PROPS,
        items: [{ date: "2026-10-20", dateLabel: "Sel, 20/10/2026", override: { type: "leave" as const, label: "Cuti" }, hasEntries: true }],
      },
    },
  ]);
});
