import * as React from "react";
import { Alert, Button, Modal } from "antd";

import type { RecoveredDraft } from "@/types/file.type";

import { CONFIRM_TITLES } from "./FileMenu.config";
import type { FileMenuProps, FileNotice } from "./FileMenu.type";
import { formatClock } from "./FileMenu.util";

/**
 * Feedback after a file action; errors are announced as alerts, the rest as status.
 * @param {FileNotice} notice - Feedback
 * @param {FileMenuProps["onDismissNotice"]} onDismiss - Close handler
 * @returns {React.ReactElement} - Alert
 */
export const renderNotice = (notice: FileNotice, onDismiss: FileMenuProps["onDismissNotice"]): React.ReactElement => (
  <Alert
    className="max-w-md !py-1"
    type={notice.type}
    showIcon
    title={notice.text}
    role={notice.type === "error" ? "alert" : "status"}
    closable={{ onClose: onDismiss, "aria-label": "Tutup pesan" }}
  />
);

/**
 * Dialog shown before discarding unsaved changes.
 * @param {FileMenuProps} props - Menu props
 * @returns {React.ReactElement} - Modal
 */
export const renderConfirmDialog = (props: FileMenuProps): React.ReactElement => (
  <Modal
    open={props.pendingConfirm !== null}
    title={props.pendingConfirm ? CONFIRM_TITLES[props.pendingConfirm] : ""}
    okText="Lanjut tanpa menyimpan"
    okButtonProps={{ danger: true }}
    cancelText="Batal"
    onOk={props.onConfirm}
    onCancel={props.onCancelConfirm}
  >
    <p>Ada perubahan yang belum disimpan ke file. Perubahan tersebut akan hilang.</p>
  </Modal>
);

/**
 * Dialog offering to restore an unsaved draft found at start-up.
 * @param {RecoveredDraft | null} draft - Draft
 * @param {FileMenuProps} props - Menu props
 * @returns {React.ReactElement} - Modal
 */
export const renderDraftDialog = (draft: RecoveredDraft | null, props: FileMenuProps): React.ReactElement => (
  <Modal
    open={draft !== null}
    title="Pulihkan draft?"
    closable={false}
    mask={{ closable: false }}
    footer={[
      <Button key="discard" onClick={props.onDiscardDraft}>
        Buang
      </Button>,
      <Button key="restore" type="primary" onClick={props.onRestoreDraft}>
        Pulihkan draft
      </Button>,
    ]}
  >
    <p>{draft ? `Ada perubahan yang belum disimpan (draft ${formatClock(draft.savedAt)}). Pulihkan?` : ""}</p>
  </Modal>
);
