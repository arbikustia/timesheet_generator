import test, { createStoreWrapper } from "@/libs/unit-test";

import { loadReviewDoc, makeDocStore } from "@/fixture/timesheet.fixture";

import AutomationSettingsContainer from "./AutomationSettings.container";

describe("AutomationSettingsContainer Snapshot Test", () => {
  test.assertSnapshots(AutomationSettingsContainer, [{ desc: "should render empty editors", props: {} }], {
    wrapper: createStoreWrapper(makeDocStore(loadReviewDoc())),
  });
});
