import * as React from "react";

import AutomationSettingsComponent from "./AutomationSettings.component";
import { useAutomationSettings } from "./AutomationSettings.hook";

/**
 * Ticket map and repository editors bound to the store document.
 * @returns {React.ReactElement} - Panel
 */
const AutomationSettingsContainer = (): React.ReactElement => {
  const settings = useAutomationSettings();

  return <AutomationSettingsComponent {...settings} />;
};

export default AutomationSettingsContainer;
