import * as React from "react";

import { renderEntryItem } from "./EntryList.helper";
import type { EntryListProps } from "./EntryList.type";

/**
 * Editable list of activities (drag to reorder within the document).
 * @param {EntryListProps} props - List props
 * @returns {React.ReactElement} - List
 */
const EntryListComponent = (props: EntryListProps): React.ReactElement => {
  const { rows } = props;

  if (rows.length === 0) {
    return <p className="text-sm text-text-secondary">Belum ada aktivitas. Tambahkan lewat form di atas.</p>;
  }

  return (
    <section aria-labelledby="entry-list-title" className="flex flex-col gap-2">
      <h3 id="entry-list-title" className="text-sm font-semibold">{`Daftar aktivitas (${rows.length})`}</h3>
      <ol className="flex flex-col gap-2">{rows.map((row) => renderEntryItem(row, props, row.index === rows.length - 1))}</ol>
    </section>
  );
};

export default EntryListComponent;
