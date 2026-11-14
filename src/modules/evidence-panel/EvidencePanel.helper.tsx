import * as React from "react";
import { FiDroplet, FiRefreshCw, FiRepeat, FiTrash2, FiUpload } from "react-icons/fi";
import { Button, Spin, Tag } from "antd";

import { getEvidenceAnchorId } from "@/libs/utils/anchor.util";

import { ACCEPTED_IMAGE_TYPES } from "@/constants/image.constant";
import type { Evidence } from "@/types/timesheet.type";

import type { EvidenceDateBlock, EvidencePanelProps, EvidenceSide } from "./EvidencePanel.type";

const SIDE_LABELS: Record<EvidenceSide, string> = { left: "Kiri", right: "Kanan" };

/**
 * A stored image with replace, blur and remove actions.
 * @param {EvidenceDateBlock} block - Date block
 * @param {Evidence} image - Image
 * @param {EvidenceSide} side - Slot
 * @param {EvidencePanelProps} props - Panel props
 * @returns {React.ReactElement} - Filled slot
 */
export const renderFilledSlot = (block: EvidenceDateBlock, image: Evidence, side: EvidenceSide, props: EvidencePanelProps): React.ReactElement => (
  <figure key={side} className="flex flex-col gap-1">
    <div className="relative flex h-28 items-center justify-center overflow-hidden rounded border border-border-default bg-white">
      <img src={image.dataUrl} alt={`Evidence ${SIDE_LABELS[side].toLowerCase()} ${block.label}`} className="max-h-full max-w-full object-contain" />
      {image.blurred && <Tag className="!absolute top-1 left-1" color="blue">Diblur</Tag>}
    </div>
    <figcaption className="flex flex-wrap gap-1">
      <label className="inline-flex cursor-pointer items-center gap-1 rounded border border-border-default px-2 text-xs">
        <FiRefreshCw aria-hidden />
        Ganti
        <input type="file" hidden accept={ACCEPTED_IMAGE_TYPES} aria-label={`Ganti gambar ${SIDE_LABELS[side].toLowerCase()} ${block.label}`} data-date={block.date} data-replace-id={image.id} onChange={props.onFileChange} />
      </label>
      {!image.blurred && (
        <Button size="small" icon={<FiDroplet aria-hidden />} aria-label={`Blur gambar ${SIDE_LABELS[side].toLowerCase()} ${block.label}`} data-date={block.date} data-id={image.id} onClick={props.onBlurImage}>
          Blur
        </Button>
      )}
      <Button size="small" danger icon={<FiTrash2 aria-hidden />} aria-label={`Hapus gambar ${SIDE_LABELS[side].toLowerCase()} ${block.label}`} data-date={block.date} data-id={image.id} onClick={props.onRemove} />
    </figcaption>
  </figure>
);

/**
 * An empty slot: drop zone and file chooser.
 * @param {EvidenceDateBlock} block - Date block
 * @param {EvidenceSide} side - Slot
 * @param {EvidencePanelProps} props - Panel props
 * @returns {React.ReactElement} - Empty slot
 */
export const renderEmptySlot = (block: EvidenceDateBlock, side: EvidenceSide, props: EvidencePanelProps): React.ReactElement => (
  <label
    key={side}
    data-date={block.date}
    className="flex h-28 cursor-pointer flex-col items-center justify-center gap-1 rounded border border-dashed border-border-strong text-center text-xs text-text-secondary"
    onDragOver={props.onDragOver}
    onDrop={props.onDrop}
  >
    <FiUpload aria-hidden />
    {`${SIDE_LABELS[side]}: tarik gambar atau klik`}
    <input type="file" hidden multiple accept={ACCEPTED_IMAGE_TYPES} aria-label={`Unggah evidence ${SIDE_LABELS[side].toLowerCase()} ${block.label}`} data-date={block.date} onChange={props.onFileChange} />
  </label>
);

/**
 * One date with its two slots.
 * @param {EvidenceDateBlock} block - Date block
 * @param {EvidencePanelProps} props - Panel props
 * @returns {React.ReactElement} - List item
 */
export const renderDateBlock = (block: EvidenceDateBlock, props: EvidencePanelProps): React.ReactElement => (
  <li
    key={block.date}
    id={getEvidenceAnchorId(block.date)}
    tabIndex={0}
    data-date={block.date}
    aria-label={`Evidence ${block.label}`}
    aria-current={block.isActive ? "true" : undefined}
    className={`flex flex-col gap-2 rounded-lg border p-2 outline-none ${block.isActive ? "border-primary-500 ring-2 ring-primary-200" : "border-border-default"}`}
    onClick={props.onActivate}
    onFocus={props.onActivate}
  >
    <div className="flex items-center gap-2 text-sm">
      <span className="font-medium">{block.label}</span>
      <span className="truncate text-text-secondary">{block.hasEntries ? block.tasks : "Tanpa aktivitas"}</span>
      {block.isProcessing && <Spin size="small" />}
      {block.images.length === 2 && (
        <Button size="small" className="ml-auto" icon={<FiRepeat aria-hidden />} aria-label={`Tukar posisi ${block.label}`} data-date={block.date} onClick={props.onSwap} />
      )}
    </div>
    <div className="grid grid-cols-2 gap-2">
      {block.images[0] ? renderFilledSlot(block, block.images[0], "left", props) : renderEmptySlot(block, "left", props)}
      {block.images[1] ? renderFilledSlot(block, block.images[1], "right", props) : renderEmptySlot(block, "right", props)}
    </div>
  </li>
);
