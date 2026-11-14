import * as React from "react";

import type { DocumentPreviewProps } from "./DocumentPreview.type";

import TimesheetDocument from "@/modules/timesheet-document";

/**
 * Scrollable live preview; pages are always white regardless of the UI theme.
 * @param {DocumentPreviewProps} props - Preview props
 * @returns {React.ReactElement} - Preview
 */
const DocumentPreviewComponent = (props: DocumentPreviewProps): React.ReactElement => {
  const { doc, containerRef, zoom } = props;

  return (
    <section ref={containerRef} aria-label="Pratinjau dokumen" className="h-full overflow-auto bg-neutral-300 py-4 dark:bg-neutral-800">
      <div data-testid="preview-zoom" data-zoom={zoom.toFixed(3)} style={{ zoom }}>
        <TimesheetDocument doc={doc} />
      </div>
    </section>
  );
};

export default DocumentPreviewComponent;
