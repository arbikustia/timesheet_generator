import * as React from "react";

import EvidencePanelComponent from "./EvidencePanel.component";
import { useEvidencePanel } from "./EvidencePanel.hook";

/**
 * Evidence panel bound to the document store.
 * @returns {React.ReactElement} - Panel
 */
const EvidencePanelContainer = (): React.ReactElement => {
  const panel = useEvidencePanel();

  return <EvidencePanelComponent {...panel} />;
};

export default EvidencePanelContainer;
