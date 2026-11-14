import * as React from "react";
import { FiLayers } from "react-icons/fi";
import { Alert, AutoComplete, Button, Checkbox, Input } from "antd";

import type { BulkFillProps } from "./BulkFill.type";

const SELECT_CLASS = "rounded-md border border-border-default bg-background-surface px-2 py-1 text-sm";

/**
 * One native date select.
 * @param {"from" | "to"} field - Draft field
 * @param {string} label - Visible label
 * @param {BulkFillProps} props - Form props
 * @returns {React.ReactElement} - Labelled select
 */
const _renderDateSelect = (field: "from" | "to", label: string, props: BulkFillProps): React.ReactElement => (
  <label className="flex flex-col gap-1 text-sm font-medium">
    {label}
    <select aria-label={label} className={SELECT_CLASS} value={props.values[field]} data-field={field} onChange={props.onFieldChange}>
      {props.dateOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </label>
);

/**
 * "Isi massal": range of working days → same task and hours. Collapsed by default.
 * @param {BulkFillProps} props - Form props
 * @returns {React.ReactElement} - Collapsible form
 */
const BulkFillComponent = (props: BulkFillProps): React.ReactElement => (
  <details className="rounded-lg border border-border-default p-2">
    <summary className="cursor-pointer text-sm font-semibold">Isi massal (rentang tanggal kerja)</summary>
    <form aria-label="Isi massal" className="mt-2 flex flex-col gap-2" onSubmit={props.onSubmit}>
      <div className="grid grid-cols-2 gap-2">
        {_renderDateSelect("from", "Dari", props)}
        {_renderDateSelect("to", "Sampai", props)}
      </div>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Task / Ticket
        <AutoComplete aria-label="Task massal" value={props.values.task} options={props.taskOptions} onChange={props.onTaskChange} />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Mulai
          <Input aria-label="Jam mulai massal" type="time" value={props.values.start} data-field="start" onChange={props.onFieldChange} />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Selesai
          <Input aria-label="Jam selesai massal" type="time" value={props.values.end} data-field="end" onChange={props.onFieldChange} />
        </label>
      </div>
      <Checkbox checked={props.values.skipFilled} onChange={props.onSkipFilledChange}>
        Lewati tanggal yang sudah punya aktivitas
      </Checkbox>
      {props.error && <Alert type="error" showIcon title={props.error} />}
      {props.notice && <Alert type="success" showIcon role="status" title={props.notice} />}
      <Button className="self-end" htmlType="submit" icon={<FiLayers aria-hidden />}>
        {`Isi ${props.targetCount} hari kerja`}
      </Button>
    </form>
  </details>
);

export default BulkFillComponent;
