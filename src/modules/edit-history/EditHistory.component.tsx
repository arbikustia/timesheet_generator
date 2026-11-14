import * as React from "react";
import { FiRotateCcw, FiRotateCw } from "react-icons/fi";
import { Button, Space, Tooltip } from "antd";

import type { EditHistoryProps } from "./EditHistory.type";

/**
 * Undo / redo buttons of the top bar.
 * @param {EditHistoryProps} props - Availability and handlers
 * @returns {React.ReactElement} - Button group
 */
const EditHistoryComponent = (props: EditHistoryProps): React.ReactElement => (
  <Space.Compact>
    <Tooltip title="Urungkan (Ctrl/Cmd+Z)">
      <Button aria-label="Urungkan" aria-keyshortcuts="Control+Z Meta+Z" icon={<FiRotateCcw aria-hidden />} disabled={!props.canUndo} onClick={props.onUndo} />
    </Tooltip>
    <Tooltip title="Ulangi (Ctrl/Cmd+Shift+Z)">
      <Button aria-label="Ulangi" aria-keyshortcuts="Control+Shift+Z Meta+Shift+Z Control+Y" icon={<FiRotateCw aria-hidden />} disabled={!props.canRedo} onClick={props.onRedo} />
    </Tooltip>
  </Space.Compact>
);

export default EditHistoryComponent;
