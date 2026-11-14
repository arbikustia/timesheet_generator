import * as React from "react";
import { Alert } from "antd";

import { getCheckStatusText, getCheckStatusType, renderIssueGroup, renderSummaryItem } from "./ExportCheck.helper";
import type { ExportCheckProps } from "./ExportCheck.type";

/**
 * "Cek sebelum export": month summary plus errors (block the export) and warnings.
 * @param {ExportCheckProps} props - Check props
 * @returns {React.ReactElement} - Panel
 */
const ExportCheckComponent = (props: ExportCheckProps): React.ReactElement => {
  const { errors, warnings, onIssueClick } = props;

  return (
    <section aria-labelledby="export-check-title" className="flex flex-col gap-3">
      <h3 id="export-check-title" className="m-0 text-sm font-semibold">
        Ringkasan bulan
      </h3>
      <dl className="m-0 grid grid-cols-2 gap-2">{props.summaryItems.map(renderSummaryItem)}</dl>
      <Alert type={getCheckStatusType(errors.length, warnings.length)} showIcon title={getCheckStatusText(errors.length, warnings.length)} />
      {renderIssueGroup("error", errors, onIssueClick)}
      {renderIssueGroup("warning", warnings, onIssueClick)}
    </section>
  );
};

export default ExportCheckComponent;
