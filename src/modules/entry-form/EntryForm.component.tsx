import * as React from "react";
import { FiCopy, FiPlus } from "react-icons/fi";
import { Alert, AutoComplete, Button, Input, Select } from "antd";

import { TASK_SEARCH } from "./EntryForm.helper";
import type { EntryFormProps } from "./EntryForm.type";

/**
 * Date and time row of the form.
 * @param {EntryFormProps} props - Form props
 * @returns {React.ReactElement} - Field row
 */
const _renderDateTimeRow = (props: EntryFormProps): React.ReactElement => (
  <div className="grid grid-cols-[1fr_auto_auto] items-end gap-2">
    <label className="flex flex-col gap-1 text-sm font-medium">
      Tanggal
      <Select aria-label="Tanggal" showSearch value={props.values.date} options={props.dateOptions} onChange={props.onDateChange} />
    </label>
    <label className="flex flex-col gap-1 text-sm font-medium">
      Mulai
      <Input aria-label="Jam mulai" type="time" value={props.values.start} onChange={props.onStartChange} />
    </label>
    <label className="flex flex-col gap-1 text-sm font-medium">
      Selesai
      <Input aria-label="Jam selesai" type="time" value={props.values.end} onChange={props.onEndChange} />
    </label>
  </div>
);

/**
 * Quick-add activity form (no popup). Enter submits.
 * @param {EntryFormProps} props - Form props
 * @returns {React.ReactElement} - Form
 */
const EntryFormComponent = (props: EntryFormProps): React.ReactElement => {
  const { values, taskOptions, error, canDuplicate, taskInputRef } = props;

  return (
    <form aria-label="Tambah aktivitas" className="flex flex-col gap-3" onSubmit={props.onSubmit}>
      {_renderDateTimeRow(props)}
      <label className="flex flex-col gap-1 text-sm font-medium">
        Task / Ticket
        <AutoComplete
          ref={taskInputRef}
          aria-label="Task"
          value={values.task}
          options={taskOptions}
          showSearch={TASK_SEARCH}
          placeholder="mis. Tech debt case admin list"
          onChange={props.onTaskChange}
        />
      </label>
      {error && <Alert type="error" showIcon title={error} />}
      <div className="flex justify-end gap-2">
        <Button icon={<FiCopy aria-hidden />} disabled={!canDuplicate} onClick={props.onDuplicatePrevious}>
          Duplikat sebelumnya
        </Button>
        <Button type="primary" htmlType="submit" icon={<FiPlus aria-hidden />}>
          Tambah
        </Button>
      </div>
    </form>
  );
};

export default EntryFormComponent;
