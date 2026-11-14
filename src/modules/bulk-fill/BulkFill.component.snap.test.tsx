import test from "@/libs/unit-test";

import BulkFillComponent from "./BulkFill.component";

describe("BulkFillComponent Snapshot Test", () => {
  test.assertSnapshots(BulkFillComponent, [
    {
      desc: "should render the form for two working days",
      props: {
        values: { from: "2026-10-01", to: "2026-10-02", task: "Daily", start: "08:00", end: "17:00", skipFilled: true },
        dateOptions: [{ value: "2026-10-01", label: "Kam, 01/10/2026" }],
        taskOptions: [],
        targetCount: 2,
        error: null,
        notice: null,
        onFieldChange: jest.fn(),
        onTaskChange: jest.fn(),
        onSkipFilledChange: jest.fn(),
        onSubmit: jest.fn(),
      },
    },
  ]);
});
