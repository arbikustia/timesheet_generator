import * as React from "react";
import { FiCheck, FiCode, FiCpu, FiDownload, FiEdit3, FiGitBranch, FiX } from "react-icons/fi";
import { Button, Input, Tag } from "antd";

import { getReviewAnchorId } from "@/libs/utils/anchor.util";

import type { EntrySource } from "@/types/timesheet.type";

import { SOURCE_LABELS } from "./ImportReview.config";
import type { ImportReviewProps, ReviewDay, ReviewItem, ReviewWeek } from "./ImportReview.type";

const SOURCE_ICONS: Record<EntrySource, React.ReactElement> = {
  manual: <FiEdit3 aria-hidden />,
  git: <FiGitBranch aria-hidden />,
  vscode: <FiCode aria-hidden />,
  "claude-code": <FiCpu aria-hidden />,
  import: <FiDownload aria-hidden />,
};

/**
 * Source, ticket/branch/repo, real-hours hint, session summary and touched files of an item.
 * @param {ReviewItem} item - Review item
 * @returns {React.ReactElement} - Details
 */
export const renderItemDetails = (item: ReviewItem): React.ReactElement => {
  const files = item.entry.refs?.files ?? [];

  return (
    <div className="flex flex-col gap-1 text-xs text-text-secondary">
      <div className="flex flex-wrap items-center gap-2">
        <Tag icon={SOURCE_ICONS[item.source]} className="!m-0 inline-flex items-center gap-1">
          {SOURCE_LABELS[item.source]}
        </Tag>
        {item.meta && <span>{item.meta}</span>}
        {item.entry.refs?.needsName && <Tag color="warning" className="!m-0">perlu nama</Tag>}
      </div>
      {item.hintText && <span>{item.hintText}</span>}
      {item.entry.refs?.summary && <span>{`Claude Code: ${item.entry.refs.summary}`}</span>}
      {files.length > 0 && (
        <details>
          <summary className="cursor-pointer">{`${files.length} file tersentuh`}</summary>
          <ul className="m-0 list-disc pl-5">
            {files.map((path) => (
              <li key={path} className="break-all">
                {path}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
};

/**
 * One automatic entry with its task input and actions.
 * @param {ReviewItem} item - Review item
 * @param {ImportReviewProps} props - Panel props
 * @returns {React.ReactElement} - List item
 */
export const renderReviewItem = (item: ReviewItem, props: ImportReviewProps): React.ReactElement => {
  const { entry } = item;

  return (
    <li key={entry.id} id={getReviewAnchorId(entry.id)} tabIndex={-1} className="flex flex-col gap-2 rounded-lg border border-border-default p-2" aria-label={`Usulan ${entry.task}`}>
      {renderItemDetails(item)}
      <Input aria-label="Nama task" value={entry.task} data-entry-id={entry.id} onChange={props.onTaskChange} />
      <div className="flex flex-wrap items-center gap-2">
        <Button size="small" type="primary" icon={<FiCheck aria-hidden />} data-entry-id={entry.id} onClick={props.onAccept}>
          Terima
        </Button>
        <Button size="small" danger icon={<FiX aria-hidden />} data-entry-id={entry.id} onClick={props.onReject}>
          Tolak
        </Button>
        {item.mergeOptions.length > 0 && (
          <select
            aria-label="Gabung dengan baris lain"
            className="rounded border border-border-default bg-background-surface px-1 py-0.5 text-sm"
            value=""
            data-entry-id={entry.id}
            onChange={props.onMergeChange}
          >
            <option value="">Gabung dengan…</option>
            {item.mergeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}
      </div>
    </li>
  );
};

/**
 * One date with its automatic entries.
 * @param {ReviewDay} day - Date group
 * @param {ImportReviewProps} props - Panel props
 * @returns {React.ReactElement} - Group
 */
export const renderReviewDay = (day: ReviewDay, props: ImportReviewProps): React.ReactElement => (
  <div key={day.date} className="flex flex-col gap-1">
    <h5 className="m-0 text-sm font-medium">{day.label}</h5>
    <ul className="m-0 flex list-none flex-col gap-2 p-0">{day.items.map((item) => renderReviewItem(item, props))}</ul>
  </div>
);

/**
 * One week with "accept all".
 * @param {ReviewWeek} week - Week group
 * @param {ImportReviewProps} props - Panel props
 * @returns {React.ReactElement} - Section
 */
export const renderReviewWeek = (week: ReviewWeek, props: ImportReviewProps): React.ReactElement => (
  <section key={week.key} aria-label={week.label} className="flex flex-col gap-2">
    <div className="flex flex-wrap items-center gap-2">
      <h4 className="m-0 text-sm font-semibold">{week.label}</h4>
      <Button size="small" className="ml-auto" icon={<FiCheck aria-hidden />} data-week={week.key} onClick={props.onAcceptWeek}>
        {`Terima semua minggu ini (${week.entryIds.length})`}
      </Button>
    </div>
    {week.days.map((day) => renderReviewDay(day, props))}
  </section>
);
