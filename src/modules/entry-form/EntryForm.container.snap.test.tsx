import test, { createStoreWrapper } from "@/libs/unit-test";

import { makeEmptyOctoberStore } from "@/fixture/timesheet.fixture";

import EntryFormContainer from "./EntryForm.container";

describe("EntryFormContainer Snapshot Test", () => {
  test.assertSnapshots(EntryFormContainer, [{ desc: "should render the form for an empty October", props: {} }], {
    wrapper: createStoreWrapper(makeEmptyOctoberStore()),
  });
});
