import test from "@/libs/unit-test";

import EntryFormComponent from "./EntryForm.component";

const BASE_PROPS = {
  values: { date: "2026-10-01", task: "", start: "08:00", end: "17:00" },
  dateOptions: [{ value: "2026-10-01", label: "Kam, 01/10/2026" }],
  taskOptions: [],
  error: null,
  canDuplicate: false,
  taskInputRef: { current: null },
  onDateChange: jest.fn(),
  onTaskChange: jest.fn(),
  onStartChange: jest.fn(),
  onEndChange: jest.fn(),
  onDuplicatePrevious: jest.fn(),
  onSubmit: jest.fn(),
};

describe("EntryFormComponent Snapshot Test", () => {
  test.assertSnapshots(EntryFormComponent, [
    { desc: "should render an empty quick-add form", props: BASE_PROPS },
    { desc: "should render a validation error", props: { ...BASE_PROPS, error: "Task wajib diisi." } },
  ]);
});
