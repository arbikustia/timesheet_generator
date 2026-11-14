import * as React from "react";

import ImportReviewComponent from "./ImportReview.component";
import { useImportReview } from "./ImportReview.hook";

/**
 * Review of automatic entries bound to the store document.
 * @returns {React.ReactElement} - Panel
 */
const ImportReviewContainer = (): React.ReactElement => {
  const review = useImportReview();

  return <ImportReviewComponent {...review} />;
};

export default ImportReviewContainer;
