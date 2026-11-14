import * as React from "react";
import { Button, Modal, Select } from "antd";

import { getConfirmMessage, renderConfirmFooter } from "./PeriodPanel.helper";
import type { PeriodPanelProps } from "./PeriodPanel.type";

/**
 * Period panel: month & year pickers and "Mulai bulan berikutnya".
 * @param {PeriodPanelProps} props - Panel props
 * @returns {React.ReactElement} - Panel
 */
const PeriodPanelComponent = (props: PeriodPanelProps): React.ReactElement => {
  const { month, year, monthOptions, yearOptions, nextPeriodLabel, pendingAction } = props;

  return (
    <section aria-labelledby="period-title" className="flex flex-wrap items-end gap-3">
      <h2 id="period-title" className="sr-only">
        Periode
      </h2>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Bulan
        <Select aria-label="Bulan" className="w-40" value={month} options={monthOptions} onChange={props.onMonthChange} />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Tahun
        <Select aria-label="Tahun" className="w-28" value={year} options={yearOptions} onChange={props.onYearChange} />
      </label>
      <Button onClick={props.onStartNextMonth}>{`Mulai ${nextPeriodLabel}`}</Button>
      <Modal
        open={pendingAction !== null}
        title="Konfirmasi periode"
        onCancel={props.onCancel}
        footer={pendingAction ? renderConfirmFooter(props, pendingAction) : null}
      >
        <p>{pendingAction ? getConfirmMessage(pendingAction, nextPeriodLabel) : ""}</p>
      </Modal>
    </section>
  );
};

export default PeriodPanelComponent;
