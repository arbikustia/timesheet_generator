import * as React from "react";

import DayOverridesComponent from "./DayOverrides.component";
import { useDayOverrides } from "./DayOverrides.hook";

/**
 * Day markings bound to the document store.
 * @returns {React.ReactElement} - Panel
 */
const DayOverridesContainer = (): React.ReactElement => {
  const panel = useDayOverrides();

  return <DayOverridesComponent {...panel} />;
};

export default DayOverridesContainer;
