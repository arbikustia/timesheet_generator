import * as React from "react";

import EntryListComponent from "./EntryList.component";
import { useEntryList } from "./EntryList.hook";

/**
 * Activity list bound to the document store.
 * @returns {React.ReactElement} - List
 */
const EntryListContainer = (): React.ReactElement => {
  const list = useEntryList();

  return <EntryListComponent {...list} />;
};

export default EntryListContainer;
