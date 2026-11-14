import test, { createStoreWrapper } from "@/libs/unit-test";

import { makeEmptyOctoberStore } from "@/fixture/timesheet.fixture";

import FileMenuContainer from "./FileMenu.container";

describe("FileMenuContainer Snapshot Test", () => {
  test.assertSnapshots(FileMenuContainer, [{ desc: "should render a new clean document", props: {} }], {
    wrapper: createStoreWrapper(makeEmptyOctoberStore()),
  });
});
