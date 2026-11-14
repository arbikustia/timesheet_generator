import * as React from "react";

import DocumentPreviewComponent from "./DocumentPreview.component";
import { useDocumentPreview } from "./DocumentPreview.hook";

/**
 * Live preview bound to the document store.
 * @returns {React.ReactElement} - Preview
 */
const DocumentPreviewContainer = (): React.ReactElement => {
  const preview = useDocumentPreview();

  return <DocumentPreviewComponent {...preview} />;
};

export default DocumentPreviewContainer;
