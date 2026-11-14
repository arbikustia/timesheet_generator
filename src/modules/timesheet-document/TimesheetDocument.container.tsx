import * as React from "react";

import TimesheetDocumentComponent from "./TimesheetDocument.component";
import { useDocumentView } from "./TimesheetDocument.hook";
import type { TimesheetDocumentContainerProps } from "./TimesheetDocument.type";

/**
 * Render the output document of a parsed timesheet. The document is already normalized by
 * `parseTimesheetDoc`, so no fallback is applied here.
 * @param {TimesheetDocumentContainerProps} props - Container props
 * @returns {React.ReactElement} - Document pages
 */
const TimesheetDocumentContainer = (props: TimesheetDocumentContainerProps): React.ReactElement => {
  const { doc } = props;
  const { view } = useDocumentView(doc);

  return <TimesheetDocumentComponent view={view} />;
};

export default TimesheetDocumentContainer;
