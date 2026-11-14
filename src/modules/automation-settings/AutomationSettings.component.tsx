import * as React from "react";
import { FiPlus } from "react-icons/fi";
import { Button, Input } from "antd";

import { renderRepoRow, renderTicketRow } from "./AutomationSettings.helper";
import type { AutomationSettingsProps } from "./AutomationSettings.type";

/**
 * Ticket → task name map with an add form.
 * @param {AutomationSettingsProps} props - Panel props
 * @returns {React.ReactElement} - Section
 */
const _renderTicketMap = (props: AutomationSettingsProps): React.ReactElement => (
  <section aria-labelledby="ticket-map-title" className="flex flex-col gap-2">
    <h4 id="ticket-map-title" className="m-0 text-sm font-semibold">
      Nama task per ticket
    </h4>
    <p className="m-0 text-xs text-text-secondary">Dipakai CLI saat impor. Nama yang diubah lalu diterima di review otomatis tersimpan di sini.</p>
    {props.ticketRows.length > 0 && <ul className="m-0 flex list-none flex-col gap-1 p-0">{props.ticketRows.map((row) => renderTicketRow(row, props))}</ul>}
    <form aria-label="Tambah ticket" className="flex flex-wrap items-center gap-2" onSubmit={props.onAddTicket}>
      <Input size="small" className="!w-28" aria-label="Ticket baru" placeholder="BIT-123" value={props.newTicket} onChange={props.onNewTicketChange} />
      <Input size="small" className="!w-60 flex-1" aria-label="Nama task baru" placeholder="Fixing flow case transfer" value={props.newName} onChange={props.onNewNameChange} />
      <Button size="small" htmlType="submit" icon={<FiPlus aria-hidden />}>
        Tambah
      </Button>
    </form>
    {props.ticketError && (
      <p role="alert" className="m-0 text-xs text-danger-strong">
        {props.ticketError}
      </p>
    )}
  </section>
);

/**
 * Ticket map and repository list for the collectors (PROMPT §12.5); stored in the document.
 * @param {AutomationSettingsProps} props - Panel props
 * @returns {React.ReactElement} - Panel
 */
const AutomationSettingsComponent = (props: AutomationSettingsProps): React.ReactElement => (
  <div className="flex flex-col gap-4 border-t border-border-default pt-3">
    {_renderTicketMap(props)}
    <section aria-labelledby="repos-title" className="flex flex-col gap-2">
      <h4 id="repos-title" className="m-0 text-sm font-semibold">
        Repo yang dipantau
      </h4>
      <p className="m-0 text-xs text-text-secondary">
        Path lokal di laptop ini (dibaca read-only oleh <code>timesheet snapshot --doc</code>). CLI juga membaca <code>~/.timesheet/config.json</code>.
      </p>
      {props.repos.length > 0 && <ul className="m-0 flex list-none flex-col gap-1 p-0">{props.repos.map((repo, index) => renderRepoRow(repo, index, props))}</ul>}
      <Button size="small" className="self-start" icon={<FiPlus aria-hidden />} onClick={props.onAddRepo}>
        Tambah repo
      </Button>
    </section>
  </div>
);

export default AutomationSettingsComponent;
