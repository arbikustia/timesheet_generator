import * as React from "react";

import PeriodPanelComponent from "./PeriodPanel.component";
import { usePeriodPanel } from "./PeriodPanel.hook";

/**
 * Period panel bound to the document store.
 * @returns {React.ReactElement} - Period panel
 */
const PeriodPanelContainer = (): React.ReactElement => {
  const panel = usePeriodPanel();

  return <PeriodPanelComponent {...panel} />;
};

export default PeriodPanelContainer;
