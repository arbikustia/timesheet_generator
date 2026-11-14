import * as React from "react";

import BulkFillComponent from "./BulkFill.component";
import { useBulkFill } from "./BulkFill.hook";

/**
 * Bulk fill bound to the store document.
 * @returns {React.ReactElement} - Form
 */
const BulkFillContainer = (): React.ReactElement => {
  const form = useBulkFill();

  return <BulkFillComponent {...form} />;
};

export default BulkFillContainer;
