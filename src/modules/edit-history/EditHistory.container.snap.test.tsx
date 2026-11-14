import test, { createStoreWrapper } from "@/libs/unit-test";

import { makeEmptyOctoberStore } from "@/fixture/timesheet.fixture";

import EditHistoryContainer from "./EditHistory.container";

describe("EditHistoryContainer Snapshot Test", () => {
  test.assertSnapshots(EditHistoryContainer, [{ desc: "should render disabled controls without history", props: {} }], {
    wrapper: createStoreWrapper(makeEmptyOctoberStore()),
  });
});
