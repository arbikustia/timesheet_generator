import * as React from "react";

import TimesheetBuilderComponent from "./TimesheetBuilder.component";
import { useTimesheetBuilder } from "./TimesheetBuilder.hook";

/**
 * Timesheet Builder page.
 * @returns {React.ReactElement} - Page
 */
const TimesheetBuilderContainer = (): React.ReactElement => {
  const shell = useTimesheetBuilder();

  return <TimesheetBuilderComponent {...shell} />;
};

export default TimesheetBuilderContainer;
