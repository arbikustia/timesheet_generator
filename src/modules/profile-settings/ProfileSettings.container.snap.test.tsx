import test, { createStoreWrapper } from "@/libs/unit-test";

import { makeDocStore } from "@/fixture/timesheet.fixture";

import ProfileSettingsContainer from "./ProfileSettings.container";

describe("ProfileSettingsContainer Snapshot Test", () => {
  test.assertSnapshots(ProfileSettingsContainer, [{ desc: "should render the October settings", props: {} }], {
    wrapper: createStoreWrapper(makeDocStore()),
  });
});
