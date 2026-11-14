import * as React from "react";

import PreviousMonthImportComponent from "./PreviousMonthImport.component";
import { usePreviousMonthImport } from "./PreviousMonthImport.hook";

/**
 * Previous-month import bound to the store document.
 * @returns {React.ReactElement} - Section
 */
const PreviousMonthImportContainer = (): React.ReactElement => {
  const importer = usePreviousMonthImport();

  return <PreviousMonthImportComponent {...importer} />;
};

export default PreviousMonthImportContainer;
