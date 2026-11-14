import * as React from "react";
import { FiClock, FiFilePlus, FiFolder, FiSave } from "react-icons/fi";
import { Button, Space, Tooltip } from "antd";

import { ACCEPTED_DOCUMENT_TYPES } from "./FileMenu.config";
import { renderConfirmDialog, renderDraftDialog, renderNotice } from "./FileMenu.helper";
import type { FileMenuProps } from "./FileMenu.type";

/**
 * File action buttons; "Buka terakhir" appears only when a previous file is remembered.
 * @param {FileMenuProps} props - Menu props
 * @param {string | null} lastFileName - Remembered file name
 * @returns {React.ReactElement} - Button group
 */
const _renderButtons = (props: FileMenuProps, lastFileName: string | null): React.ReactElement => (
  <Space.Compact>
    <Button icon={<FiFilePlus aria-hidden />} onClick={props.onNew}>
      Baru
    </Button>
    <Tooltip title="Ctrl/Cmd+O">
      <Button icon={<FiFolder aria-hidden />} onClick={props.onOpen}>
        Buka
      </Button>
    </Tooltip>
    {lastFileName && (
      <Tooltip title={lastFileName}>
        <Button icon={<FiClock aria-hidden />} onClick={props.onOpenLast}>
          Buka terakhir
        </Button>
      </Tooltip>
    )}
    <Tooltip title="Ctrl/Cmd+S">
      <Button type="primary" icon={<FiSave aria-hidden />} loading={props.isSaving} onClick={props.onSave}>
        Simpan
      </Button>
    </Tooltip>
    <Tooltip title="Ctrl/Cmd+Shift+S">
      <Button onClick={props.onSaveAs}>Simpan Sebagai</Button>
    </Tooltip>
  </Space.Compact>
);

/**
 * Word-like file buttons with the save status indicator.
 * @param {FileMenuProps} props - Menu props
 * @returns {React.ReactElement} - File menu
 */
const FileMenuComponent = (props: FileMenuProps): React.ReactElement => {
  const { fileInputRef, notice, draft, lastFileName } = props;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {_renderButtons(props, lastFileName)}
      <span className="text-sm" data-testid="file-status">
        <span className="font-medium">{props.fileLabel}</span>
        <span className={props.isDirty ? "text-warning" : "text-text-secondary"}>{` · ${props.statusText}`}</span>
      </span>
      {notice && renderNotice(notice, props.onDismissNotice)}
      <input ref={fileInputRef} type="file" accept={ACCEPTED_DOCUMENT_TYPES} hidden aria-label="Pilih file dokumen" onChange={props.onFileInputChange} />
      {renderConfirmDialog(props)}
      {renderDraftDialog(draft, props)}
    </div>
  );
};

export default FileMenuComponent;
