import test, { createStoreWrapper } from "@/libs/unit-test";

import { makeEmptyOctoberStore } from "@/fixture/timesheet.fixture";

import DayOverridesContainer from "./DayOverrides.container";

describe("DayOverridesContainer Snapshot Test", () => {
  test.assertSnapshots(DayOverridesContainer, [{ desc: "should render the form for an empty October", props: {} }], {
    wrapper: createStoreWrapper(makeEmptyOctoberStore()),
  });
});
