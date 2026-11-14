import test, { createStoreWrapper } from "@/libs/unit-test";

import { makeDocStore } from "@/fixture/timesheet.fixture";

import PeriodPanelContainer from "./PeriodPanel.container";

describe("PeriodPanelContainer Snapshot Test", () => {
  test.assertSnapshots(PeriodPanelContainer, [{ desc: "should render the store period", props: {} }], {
    wrapper: createStoreWrapper(makeDocStore()),
  });
});
