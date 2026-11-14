import * as React from "react";

import ProfileSettingsComponent from "./ProfileSettings.component";
import { useProfileSettings } from "./ProfileSettings.hook";

/**
 * Settings bound to the document store.
 * @returns {React.ReactElement} - Settings panel
 */
const ProfileSettingsContainer = (): React.ReactElement => {
  const settings = useProfileSettings();

  return <ProfileSettingsComponent {...settings} />;
};

export default ProfileSettingsContainer;
