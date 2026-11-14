import type { PointerEvent } from "react";
import type { RadioChangeEvent } from "antd";

import type { BlurEffect, BlurRegion, BlurScope, BlurSpec } from "@/types/file.type";

/** An image waiting in the editor; the original lives only in memory (never in the document). */
export type BlurEditorRequest = {
  key: string;
  file: Blob;
  name: string;
  isCode: boolean;
};

/** A point in fractions (0–1) of the image box. */
export type FractionPoint = {
  x: number;
  y: number;
};

export type DragState = {
  start: FractionPoint;
  current: FractionPoint;
};

export type BoxBounds = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type BlurEditorContainerProps = {
  request: BlurEditorRequest | null;
  isProcessing: boolean;
  onApply: (spec: BlurSpec) => void;
  onCancel: () => void;
};

export type BlurEditorProps = {
  isOpen: boolean;
  title: string;
  imageUrl: string | null;
  isCode: boolean;
  scope: BlurScope;
  effect: BlurEffect;
  regions: BlurRegion[];
  draftRegion: BlurRegion | null;
  canApply: boolean;
  isProcessing: boolean;
  onScopeChange: (event: RadioChangeEvent) => void;
  onEffectChange: (event: RadioChangeEvent) => void;
  onPointerDown: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: PointerEvent<HTMLDivElement>) => void;
  onUndoRegion: () => void;
  onClearRegions: () => void;
  onApply: () => void;
  onCancel: () => void;
};
