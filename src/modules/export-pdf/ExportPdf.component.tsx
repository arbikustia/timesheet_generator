import * as React from "react";
import { createPortal } from "react-dom";
import { FiPrinter } from "react-icons/fi";
import { Button, Modal, Tooltip } from "antd";

import type { ExportPdfProps } from "./ExportPdf.type";

import TimesheetDocument from "@/modules/timesheet-document";

/**
 * Dialog listing the errors that block the export.
 * @param {ExportPdfProps} props - Export props
 * @returns {React.ReactElement} - Modal
 */
const _renderBlockedDialog = (props: ExportPdfProps): React.ReactElement => (
  <Modal
    open={props.isBlockedOpen}
    title="Belum bisa export PDF"
    okText="Lihat Cek export"
    cancelText="Tutup"
    onOk={props.onShowCheck}
    onCancel={props.onCloseBlocked}
  >
    <p>Perbaiki error berikut dulu:</p>
    <ul className="list-disc pl-5">
      {props.errorMessages.map((message) => (
        <li key={message}>{message}</li>
      ))}
    </ul>
  </Modal>
);

/**
 * "Export PDF" button plus the print-only copy of the document. The copy is the same `<Page>` tree as the
 * preview, mounted outside the zoomed app root; print CSS shows only it (see `.print-root` in `index.css`).
 * @param {ExportPdfProps} props - Export props
 * @returns {React.ReactElement} - Button, dialog and print portal
 */
const ExportPdfComponent = (props: ExportPdfProps): React.ReactElement => (
  <>
    <Tooltip title="Ctrl/Cmd+P">
      <Button icon={<FiPrinter aria-hidden />} aria-keyshortcuts="Control+P Meta+P" onClick={props.onExport}>
        Export PDF
      </Button>
    </Tooltip>
    {_renderBlockedDialog(props)}
    {createPortal(
      <div className="print-root" aria-hidden="true" data-testid="print-root">
        <TimesheetDocument doc={props.doc} />
      </div>,
      props.printContainer,
    )}
  </>
);

export default ExportPdfComponent;
