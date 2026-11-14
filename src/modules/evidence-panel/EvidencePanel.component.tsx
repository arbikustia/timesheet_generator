import * as React from "react";
import { Alert, Checkbox } from "antd";

import { renderDateBlock } from "./EvidencePanel.helper";
import type { EvidencePanelProps } from "./EvidencePanel.type";

import BlurEditor from "@/modules/blur-editor";

/**
 * Size line, upload mode and messages above the date list.
 * @param {EvidencePanelProps} props - Panel props
 * @returns {React.ReactElement} - Header
 */
const _renderHeader = (props: EvidencePanelProps): React.ReactElement => (
  <div className="flex flex-col gap-2 text-sm">
    <p>
      Klik sebuah tanggal lalu tekan <kbd>Ctrl/Cmd+V</kbd> untuk menempel screenshot — hasil tempel dianggap screenshot kode dan
      dibuka di editor blur sebelum disimpan.
    </p>
    <Checkbox checked={props.isCodeUpload} onChange={props.onToggleCodeUpload}>
      Gambar yang diunggah/ditarik adalah screenshot kode (wajib lewat editor blur)
    </Checkbox>
    <p className="text-text-secondary" data-testid="document-size">{`Ukuran dokumen: ${props.sizeLabel}`}</p>
    {props.isTooLarge && <Alert type="warning" role="status" showIcon title="Dokumen lebih dari 15 MB. Kurangi jumlah atau ukuran gambar." />}
    {props.error && <Alert type="error" showIcon title={props.error} closable={{ onClose: props.onDismissError, "aria-label": "Tutup pesan" }} />}
  </div>
);

/**
 * Evidence per date: two slots (left/right) for each date that has activities.
 * @param {EvidencePanelProps} props - Panel props
 * @returns {React.ReactElement} - Panel
 */
const EvidencePanelComponent = (props: EvidencePanelProps): React.ReactElement => (
  <section aria-labelledby="evidence-title" className="flex flex-col gap-3" onPaste={props.onPaste}>
    <h3 id="evidence-title" className="sr-only">
      Evidence
    </h3>
    {_renderHeader(props)}
    {props.blocks.length === 0 ? (
      <p className="text-sm text-text-secondary">Belum ada aktivitas. Evidence ditempel per tanggal yang punya aktivitas.</p>
    ) : (
      <ul className="flex flex-col gap-2">{props.blocks.map((block) => renderDateBlock(block, props))}</ul>
    )}
    <BlurEditor
      key={props.blurRequest?.key ?? "idle"}
      request={props.blurRequest}
      isProcessing={props.isBlurProcessing}
      onApply={props.onBlurApply}
      onCancel={props.onBlurCancel}
    />
  </section>
);

export default EvidencePanelComponent;
