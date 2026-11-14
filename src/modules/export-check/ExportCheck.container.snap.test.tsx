import test, { createStoreWrapper } from "@/libs/unit-test";

import { makeEmptyOctoberStore } from "@/fixture/timesheet.fixture";

import ExportCheckContainer from "./ExportCheck.container";

describe("ExportCheckContainer Snapshot Test", () => {
  test.assertSnapshots(ExportCheckContainer, [{ desc: "should render the check of an empty October", props: { onNavigate: jest.fn() } }], {
    wrapper: createStoreWrapper(makeEmptyOctoberStore()),
  });
});
