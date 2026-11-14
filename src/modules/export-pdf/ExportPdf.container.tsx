import * as React from "react";

import ExportPdfComponent from "./ExportPdf.component";
import { useExportPdf } from "./ExportPdf.hook";
import type { ExportPdfContainerProps } from "./ExportPdf.type";

/**
 * PDF export bound to the store document and its export check.
 * @param {ExportPdfContainerProps} props - Opens the export check tab
 * @returns {React.ReactElement} - Export button
 */
const ExportPdfContainer = (props: ExportPdfContainerProps): React.ReactElement => {
  const exporter = useExportPdf(props.onShowCheck);

  return <ExportPdfComponent {...exporter} />;
};

export default ExportPdfContainer;
