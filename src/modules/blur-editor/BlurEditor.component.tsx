import * as React from "react";
import { FiRotateCcw, FiTrash2 } from "react-icons/fi";
import { Alert, Button, Modal, Radio } from "antd";

import { EFFECT_OPTIONS, SCOPE_OPTIONS } from "./BlurEditor.config";
import { renderSurface } from "./BlurEditor.helper";
import type { BlurEditorProps } from "./BlurEditor.type";

/**
 * Area tools: how many regions are drawn, undo the last one, clear all.
 * @param {BlurEditorProps} props - Editor props
 * @returns {React.ReactElement} - Toolbar
 */
const _renderAreaTools = (props: BlurEditorProps): React.ReactElement => (
  <div className="flex flex-wrap items-center gap-2 text-sm">
    <span>{`Seret di gambar untuk menandai area · ${props.regions.length} area`}</span>
    <Button size="small" icon={<FiRotateCcw aria-hidden />} disabled={props.regions.length === 0} onClick={props.onUndoRegion}>
      Urungkan area
    </Button>
    <Button size="small" icon={<FiTrash2 aria-hidden />} disabled={props.regions.length === 0} onClick={props.onClearRegions}>
      Hapus semua area
    </Button>
  </div>
);

/**
 * Blur editor (PROMPT §5.1): whole image (default, one click) or drawn areas, blur or pixelate.
 * The preview uses CSS; the stored result is censored on canvas pixels and the original is discarded.
 * @param {BlurEditorProps} props - Editor props
 * @returns {React.ReactElement} - Modal
 */
const BlurEditorComponent = (props: BlurEditorProps): React.ReactElement => (
  <Modal
    open={props.isOpen}
    title={props.title}
    width={960}
    okText="Terapkan blur"
    cancelText="Batal"
    okButtonProps={{ disabled: !props.canApply, loading: props.isProcessing }}
    onOk={props.onApply}
    onCancel={props.onCancel}
  >
    <div className="flex flex-col gap-3">
      {props.isCode && (
        <Alert type="info" showIcon title="Screenshot kode: hanya versi blur yang disimpan ke dokumen. Versi asli tidak pernah ditulis ke file." />
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Radio.Group aria-label="Cakupan blur" optionType="button" options={SCOPE_OPTIONS} value={props.scope} onChange={props.onScopeChange} />
        <Radio.Group aria-label="Efek" optionType="button" options={EFFECT_OPTIONS} value={props.effect} onChange={props.onEffectChange} />
      </div>
      {props.scope === "area" && _renderAreaTools(props)}
      {renderSurface(props)}
      <p className="m-0 text-xs text-text-secondary">Pratinjau perkiraan; hasil akhir diproses langsung pada piksel gambar sehingga tidak bisa dikembalikan.</p>
    </div>
  </Modal>
);

export default BlurEditorComponent;
