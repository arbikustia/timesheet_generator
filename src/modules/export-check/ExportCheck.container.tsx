import * as React from "react";

import ExportCheckComponent from "./ExportCheck.component";
import { useExportCheck } from "./ExportCheck.hook";
import type { ExportCheckContainerProps } from "./ExportCheck.type";

/**
 * Export check bound to the store document.
 * @param {ExportCheckContainerProps} props - Navigation handler
 * @returns {React.ReactElement} - Panel
 */
const ExportCheckContainer = (props: ExportCheckContainerProps): React.ReactElement => {
  const check = useExportCheck(props.onNavigate);

  return <ExportCheckComponent {...check} />;
};

export default ExportCheckContainer;
