import * as React from "react";

import FileMenuComponent from "./FileMenu.component";
import { useFileMenu } from "./FileMenu.hook";

/**
 * File menu bound to the document store and the browser file APIs.
 * @returns {React.ReactElement} - File menu
 */
const FileMenuContainer = (): React.ReactElement => {
  const menu = useFileMenu();

  return <FileMenuComponent {...menu} />;
};

export default FileMenuContainer;
