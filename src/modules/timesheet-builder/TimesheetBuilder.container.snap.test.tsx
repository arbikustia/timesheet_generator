import test, { createStoreWrapper } from "@/libs/unit-test";

import { makeEmptyOctoberStore } from "@/fixture/timesheet.fixture";

import TimesheetBuilderContainer from "./TimesheetBuilder.container";

describe("TimesheetBuilderContainer Snapshot Test", () => {
  test.assertSnapshots(TimesheetBuilderContainer, [{ desc: "should render the builder for an empty October", props: {} }], {
    wrapper: createStoreWrapper(makeEmptyOctoberStore()),
  });
});
