import * as React from "react";

import BlurEditorComponent from "./BlurEditor.component";
import { useBlurEditor } from "./BlurEditor.hook";
import type { BlurEditorContainerProps } from "./BlurEditor.type";

/**
 * Blur editor for one image held in memory. Mount it with `key={request.key}` to reset per image.
 * @param {BlurEditorContainerProps} props - Request and callbacks
 * @returns {React.ReactElement} - Editor
 */
const BlurEditorContainer = (props: BlurEditorContainerProps): React.ReactElement => {
  const editor = useBlurEditor(props);

  return <BlurEditorComponent {...editor} />;
};

export default BlurEditorContainer;
