import type { ChangeEvent, MouseEvent } from "react";

import type { FormSubmitEvent } from "@/types/common.type";
import type { AutomationRepo } from "@/types/timesheet.type";

export type TicketRow = {
  ticket: string;
  name: string;
};

export type RepoField = keyof AutomationRepo;

export type NewTicketForm = {
  newTicket: string;
  newName: string;
  ticketError: string | null;
  onNewTicketChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onNewNameChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onAddTicket: (event: FormSubmitEvent) => void;
};

export type AutomationSettingsProps = NewTicketForm & {
  ticketRows: TicketRow[];
  repos: AutomationRepo[];
  onTicketNameChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemoveTicket: (event: MouseEvent<HTMLElement>) => void;
  onRepoChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemoveRepo: (event: MouseEvent<HTMLElement>) => void;
  onAddRepo: () => void;
};
