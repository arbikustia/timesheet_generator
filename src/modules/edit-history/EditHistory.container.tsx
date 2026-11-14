import * as React from "react";

import EditHistoryComponent from "./EditHistory.component";
import { useEditHistory } from "./EditHistory.hook";

/**
 * Undo / redo controls bound to the document history.
 * @returns {React.ReactElement} - Controls
 */
const EditHistoryContainer = (): React.ReactElement => {
  const history = useEditHistory();

  return <EditHistoryComponent {...history} />;
};

export default EditHistoryContainer;
