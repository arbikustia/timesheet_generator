import * as React from "react";

import EntryFormComponent from "./EntryForm.component";
import { useEntryForm } from "./EntryForm.hook";

/**
 * Quick-add form bound to the document store.
 * @returns {React.ReactElement} - Form
 */
const EntryFormContainer = (): React.ReactElement => {
  const form = useEntryForm();

  return <EntryFormComponent {...form} />;
};

export default EntryFormContainer;
