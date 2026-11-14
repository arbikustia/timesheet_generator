import test, { createStoreWrapper } from "@/libs/unit-test";

import { makeEmptyOctoberStore } from "@/fixture/timesheet.fixture";

import BulkFillContainer from "./BulkFill.container";

describe("BulkFillContainer Snapshot Test", () => {
  test.assertSnapshots(BulkFillContainer, [{ desc: "should render the collapsed bulk fill form", props: {} }], {
    wrapper: createStoreWrapper(makeEmptyOctoberStore()),
  });
});
