import test from "@/libs/unit-test";

import { loadOctoberDoc } from "@/fixture/timesheet.fixture";

import ProfileSettingsComponent from "./ProfileSettings.component";

const BASE_PROPS = {
  profile: loadOctoberDoc().profile,
  templatesText: "",
  minDate: "2026-10-01",
  maxDate: "2026-10-31",
  signatureError: null,
  onTextChange: jest.fn(),
  onSignDateChange: jest.fn(),
  onDefaultHourChange: jest.fn(),
  onTemplatesChange: jest.fn(),
  onSignatureChange: jest.fn(),
  onSignatureRemove: jest.fn(),
};

describe("ProfileSettingsComponent Snapshot Test", () => {
  test.assertSnapshots(ProfileSettingsComponent, [{ desc: "should render the October profile", props: BASE_PROPS }]);
});
