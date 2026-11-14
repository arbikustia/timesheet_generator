import * as React from "react";
import { FiArrowDown, FiArrowUp, FiCopy, FiMenu, FiTrash2 } from "react-icons/fi";
import { Button, Input } from "antd";

import { getEntryAnchorId } from "@/libs/utils/anchor.util";

import type { EntryField } from "@/types/timesheet-edit.type";

import type { EntryListProps, EntryListRow } from "./EntryList.type";

const ENTRY_FIELDS: readonly string[] = ["date", "task", "start", "end"];

/**
 * Whether a data attribute names an editable entry field.
 * @param {string | undefined} value - `data-field` value
 * @returns {boolean} - True for date, task, start or end
 */
export const isEntryField = (value: string | undefined): value is EntryField => {
  return value !== undefined && ENTRY_FIELDS.includes(value);
};

/**
 * Read a numeric `data-index` attribute.
 * @param {HTMLElement} element - Element carrying the attribute
 * @returns {number} - Index, or -1 when missing
 */
export const readIndex = (element: HTMLElement): number => {
  const value = Number(element.dataset.index);

  return Number.isInteger(value) ? value : -1;
};

/**
 * Action buttons of one entry.
 * @param {EntryListRow} row - Entry row
 * @param {EntryListProps} props - List props
 * @param {boolean} isLast - Whether it is the last row
 * @returns {React.ReactElement} - Button group
 */
export const renderEntryActions = (row: EntryListRow, props: EntryListProps, isLast: boolean): React.ReactElement => (
  <div className="flex gap-1">
    <Button size="small" aria-label="Naikkan" icon={<FiArrowUp aria-hidden />} data-index={row.index} disabled={row.index === 0} onClick={props.onMoveUp} />
    <Button size="small" aria-label="Turunkan" icon={<FiArrowDown aria-hidden />} data-index={row.index} disabled={isLast} onClick={props.onMoveDown} />
    <Button size="small" aria-label="Duplikat" icon={<FiCopy aria-hidden />} data-entry-id={row.entry.id} onClick={props.onDuplicate} />
    <Button size="small" danger aria-label="Hapus" icon={<FiTrash2 aria-hidden />} data-entry-id={row.entry.id} onClick={props.onRemove} />
  </div>
);

/**
 * First line of an entry: drag handle, date, times and actions.
 * @param {EntryListRow} row - Entry row
 * @param {EntryListProps} props - List props
 * @param {boolean} isLast - Whether it is the last row
 * @returns {React.ReactElement} - Line
 */
export const renderEntryHeader = (row: EntryListRow, props: EntryListProps, isLast: boolean): React.ReactElement => (
  <div className="flex flex-wrap items-center gap-2">
    <FiMenu aria-hidden className="cursor-grab text-text-secondary" />
    <select
      aria-label="Tanggal aktivitas"
      className="h-8 rounded-md border border-border-default bg-background-surface px-1 text-sm"
      value={row.entry.date}
      data-entry-id={row.entry.id}
      data-field="date"
      onChange={props.onFieldChange}
    >
      {row.isOutsidePeriod && <option value={row.entry.date}>{row.entry.date} (di luar periode)</option>}
      {props.dateOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    <Input size="small" className="!w-24" aria-label="Mulai" type="time" value={row.entry.start} data-entry-id={row.entry.id} data-field="start" onChange={props.onFieldChange} />
    <Input size="small" className="!w-24" aria-label="Selesai" type="time" value={row.entry.end} data-entry-id={row.entry.id} data-field="end" onChange={props.onFieldChange} />
    <span className="ml-auto">{renderEntryActions(row, props, isLast)}</span>
  </div>
);

/**
 * One draggable entry item.
 * @param {EntryListRow} row - Entry row
 * @param {EntryListProps} props - List props
 * @param {boolean} isLast - Whether it is the last row
 * @returns {React.ReactElement} - List item
 */
export const renderEntryItem = (row: EntryListRow, props: EntryListProps, isLast: boolean): React.ReactElement => (
  <li
    key={row.entry.id}
    id={getEntryAnchorId(row.entry.id)}
    tabIndex={-1}
    draggable
    data-index={row.index}
    aria-label={`Aktivitas ${row.entry.date}`}
    className={`flex flex-col gap-2 rounded-lg border p-2 ${props.dragIndex === row.index ? "opacity-50" : ""} ${row.isOutsidePeriod ? "border-danger" : "border-border-default"}`}
    onDragStart={props.onDragStart}
    onDragOver={props.onDragOver}
    onDrop={props.onDrop}
    onDragEnd={props.onDragEnd}
  >
    {renderEntryHeader(row, props, isLast)}
    <Input aria-label="Task" value={row.entry.task} data-entry-id={row.entry.id} data-field="task" onChange={props.onFieldChange} />
    <Input.TextArea
      aria-label="Remark manual"
      autoSize={{ minRows: 1, maxRows: 3 }}
      placeholder="Remark otomatis (isi untuk override)"
      value={row.remarkText}
      data-entry-id={row.entry.id}
      onChange={props.onRemarkChange}
    />
  </li>
);
