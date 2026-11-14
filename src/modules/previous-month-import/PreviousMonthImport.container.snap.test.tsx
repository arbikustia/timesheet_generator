import test, { createStoreWrapper } from "@/libs/unit-test";

import { makeEmptyOctoberStore } from "@/fixture/timesheet.fixture";

import PreviousMonthImportContainer from "./PreviousMonthImport.container";

describe("PreviousMonthImportContainer Snapshot Test", () => {
  test.assertSnapshots(PreviousMonthImportContainer, [{ desc: "should render the import button", props: {} }], {
    wrapper: createStoreWrapper(makeEmptyOctoberStore()),
  });
});
