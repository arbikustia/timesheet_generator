import { type ChangeEvent, type MouseEvent, useMemo, useState } from "react";

import type { FormSubmitEvent } from "@/types/common.type";

import type { AutomationSettingsProps, NewTicketForm } from "./AutomationSettings.type";
import { isRepoField, toTicketRows, validateTicket } from "./AutomationSettings.util";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addRepo, removeRepo, removeTicketName, selectDoc, setTicketName, updateRepo } from "@/store/timesheet.slice";

/**
 * Form that adds a ticket → task name pair.
 * @param {string} ticketPattern - Ticket regex of the document
 * @returns {NewTicketForm} - Values and handlers
 */
export const useNewTicketForm = (ticketPattern: string): NewTicketForm => {
  const dispatch = useAppDispatch();
  const [newTicket, setNewTicket] = useState<string>("");
  const [newName, setNewName] = useState<string>("");
  const [ticketError, setTicketError] = useState<string | null>(null);

  /**
   * Type the new ticket.
   * @param {ChangeEvent<HTMLInputElement>} event - Change event
   * @returns {void}
   */
  const handleNewTicketChange = (event: ChangeEvent<HTMLInputElement>): void => setNewTicket(event.currentTarget.value);

  /**
   * Type the new task name.
   * @param {ChangeEvent<HTMLInputElement>} event - Change event
   * @returns {void}
   */
  const handleNewNameChange = (event: ChangeEvent<HTMLInputElement>): void => setNewName(event.currentTarget.value);

  /**
   * Add the pair and clear the form.
   * @param {FormSubmitEvent} event - Submit event
   * @returns {void}
   */
  const handleAddTicket = (event: FormSubmitEvent): void => {
    event.preventDefault();
    const error = validateTicket(newTicket, ticketPattern) ?? (newName.trim() ? null : "Nama task wajib diisi.");

    setTicketError(error);

    if (!error) {
      dispatch(setTicketName({ ticket: newTicket, name: newName }));
      setNewTicket("");
      setNewName("");
    }
  };

  return {
    newTicket,
    newName,
    ticketError,
    onNewTicketChange: handleNewTicketChange,
    onNewNameChange: handleNewNameChange,
    onAddTicket: handleAddTicket,
  };
};

/**
 * Remove a ticket (`data-ticket`) or repository (`data-index`), add an empty repository row.
 * @returns {Pick<AutomationSettingsProps, "onRemoveTicket" | "onRemoveRepo" | "onAddRepo">} - Handlers
 */
export const useListRemovals = (): Pick<AutomationSettingsProps, "onRemoveTicket" | "onRemoveRepo" | "onAddRepo"> => {
  const dispatch = useAppDispatch();

  /**
   * Remove a ticket name.
   * @param {MouseEvent<HTMLElement>} event - Click event
   * @returns {void}
   */
  const handleRemoveTicket = (event: MouseEvent<HTMLElement>): void => {
    const { ticket } = event.currentTarget.dataset;

    if (ticket) {
      dispatch(removeTicketName(ticket));
    }
  };

  /**
   * Remove a repository.
   * @param {MouseEvent<HTMLElement>} event - Click event
   * @returns {void}
   */
  const handleRemoveRepo = (event: MouseEvent<HTMLElement>): void => {
    dispatch(removeRepo(Number(event.currentTarget.dataset.index)));
  };

  /**
   * Add an empty repository row.
   * @returns {void}
   */
  const handleAddRepo = (): void => {
    dispatch(addRepo());
  };

  return { onRemoveTicket: handleRemoveTicket, onRemoveRepo: handleRemoveRepo, onAddRepo: handleAddRepo };
};

/**
 * Ticket map and repository list editors (stored in the document, carried to the next month).
 * @returns {AutomationSettingsProps} - View props
 */
export const useAutomationSettings = (): AutomationSettingsProps => {
  const dispatch = useAppDispatch();
  const { automation } = useAppSelector(selectDoc);
  const ticketRows = useMemo(() => toTicketRows(automation.ticketMap), [automation.ticketMap]);

  /**
   * Rename a ticket (`data-ticket`).
   * @param {ChangeEvent<HTMLInputElement>} event - Change event
   * @returns {void}
   */
  const handleTicketNameChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const { ticket } = event.currentTarget.dataset;

    if (ticket) {
      dispatch(setTicketName({ ticket, name: event.currentTarget.value }));
    }
  };

  /**
   * Edit a repository path or label (`data-index`, `data-field`).
   * @param {ChangeEvent<HTMLInputElement>} event - Change event
   * @returns {void}
   */
  const handleRepoChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const { index, field } = event.currentTarget.dataset;

    if (index !== undefined && isRepoField(field)) {
      dispatch(updateRepo({ index: Number(index), changes: { [field]: event.currentTarget.value } }));
    }
  };

  return {
    ticketRows,
    repos: automation.repos,
    onTicketNameChange: handleTicketNameChange,
    onRepoChange: handleRepoChange,
    ...useListRemovals(),
    ...useNewTicketForm(automation.ticketPattern),
  };
};
