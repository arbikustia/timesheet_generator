import * as React from "react";
import { FiTrash2 } from "react-icons/fi";
import { Button, Tag } from "antd";

import type { DayOverrideItem, DayOverridesProps } from "./DayOverrides.type";

/**
 * One marked day row.
 * @param {DayOverrideItem} item - Marked day
 * @param {DayOverridesProps["onRemove"]} onRemove - Remove handler
 * @returns {React.ReactElement} - List item
 */
export const renderOverrideItem = (item: DayOverrideItem, onRemove: DayOverridesProps["onRemove"]): React.ReactElement => (
  <li key={item.date} className="flex items-center gap-2 rounded-lg border border-border-default p-2 text-sm">
    <span className="font-medium">{item.dateLabel}</span>
    <Tag color={item.override.type === "holiday" ? "red" : "orange"}>{item.override.label}</Tag>
    {item.hasEntries && <span className="text-xs text-warning-strong">Ada aktivitas — baris tetap tampil sebagai aktivitas</span>}
    <Button size="small" danger className="ml-auto" aria-label={`Hapus ${item.dateLabel}`} icon={<FiTrash2 aria-hidden />} data-date={item.date} onClick={onRemove} />
  </li>
);
