import test, { createStoreWrapper } from "@/libs/unit-test";

import { loadOctoberDoc, makeDocStore } from "@/fixture/timesheet.fixture";

import EntryListContainer from "./EntryList.container";

const DOC = loadOctoberDoc();

describe("EntryListContainer Snapshot Test", () => {
  test.assertSnapshots(EntryListContainer, [{ desc: "should render the first two October activities", props: {} }], {
    wrapper: createStoreWrapper(makeDocStore({ ...DOC, entries: DOC.entries.slice(0, 2) })),
  });
});
