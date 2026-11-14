import * as React from "react";
import { FiTrash2 } from "react-icons/fi";
import { Button, Input } from "antd";

import type { AutomationRepo } from "@/types/timesheet.type";

import type { AutomationSettingsProps, TicketRow } from "./AutomationSettings.type";

/**
 * One ticket → task name row.
 * @param {TicketRow} row - Row
 * @param {AutomationSettingsProps} props - Panel props
 * @returns {React.ReactElement} - List item
 */
export const renderTicketRow = (row: TicketRow, props: AutomationSettingsProps): React.ReactElement => (
  <li key={row.ticket} className="flex items-center gap-2">
    <code className="w-24 shrink-0 text-xs">{row.ticket}</code>
    <Input size="small" aria-label={`Nama task ${row.ticket}`} value={row.name} data-ticket={row.ticket} onChange={props.onTicketNameChange} />
    <Button size="small" danger aria-label={`Hapus ${row.ticket}`} icon={<FiTrash2 aria-hidden />} data-ticket={row.ticket} onClick={props.onRemoveTicket} />
  </li>
);

/**
 * One repository row: local path and label.
 * @param {AutomationRepo} repo - Repository
 * @param {number} index - Position
 * @param {AutomationSettingsProps} props - Panel props
 * @returns {React.ReactElement} - List item
 */
export const renderRepoRow = (repo: AutomationRepo, index: number, props: AutomationSettingsProps): React.ReactElement => (
  <li key={index} className="flex items-center gap-2">
    <Input size="small" aria-label={`Path repo ${index + 1}`} placeholder="/home/saya/work/bantuit-fe" value={repo.path} data-index={index} data-field="path" onChange={props.onRepoChange} />
    <Input size="small" className="!w-40" aria-label={`Label repo ${index + 1}`} placeholder="BANTUIT FE" value={repo.label} data-index={index} data-field="label" onChange={props.onRepoChange} />
    <Button size="small" danger aria-label={`Hapus repo ${index + 1}`} icon={<FiTrash2 aria-hidden />} data-index={index} onClick={props.onRemoveRepo} />
  </li>
);
