import test, { createStoreWrapper } from "@/libs/unit-test";

import { makeEmptyOctoberStore } from "@/fixture/timesheet.fixture";

import EvidencePanelContainer from "./EvidencePanel.container";

describe("EvidencePanelContainer Snapshot Test", () => {
  test.assertSnapshots(EvidencePanelContainer, [{ desc: "should render the empty state", props: {} }], {
    wrapper: createStoreWrapper(makeEmptyOctoberStore()),
  });
});
