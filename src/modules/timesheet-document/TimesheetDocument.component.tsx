import * as React from "react";

import {
  renderEvidenceCover,
  renderEvidencePage,
  renderSheetPage,
  renderSignaturePage,
} from "./TimesheetDocument.helper";
import styles from "./TimesheetDocument.style";
import type { TimesheetDocumentProps } from "./TimesheetDocument.type";

/**
 * Render every A4 page in output order: timesheet → signature → evidence cover → evidence pages.
 * The same tree is used for the live preview and for printing to PDF.
 * @param {TimesheetDocumentProps} props - Component props
 * @returns {React.ReactElement} - Document pages
 */
const TimesheetDocumentComponent = (props: TimesheetDocumentProps): React.ReactElement => {
  const { view } = props;

  return (
    <div className="timesheet-document" lang="en" style={styles.document} data-testid="timesheet-document">
      {view.sheetPages.map((page) => renderSheetPage(page, view))}
      {renderSignaturePage(view.signature)}
      {renderEvidenceCover(view.cover)}
      {view.evidencePages.map((page) => renderEvidencePage(page, view.monthLabel))}
    </div>
  );
};

export default TimesheetDocumentComponent;
