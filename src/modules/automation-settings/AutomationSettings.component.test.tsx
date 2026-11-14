import { fireEvent, render, screen } from "@/libs/unit-test";

import AutomationSettingsComponent from "./AutomationSettings.component";
import type { AutomationSettingsProps } from "./AutomationSettings.type";

/**
 * Build component props.
 * @param {Partial<AutomationSettingsProps>} [overrides] - Prop overrides
 * @returns {AutomationSettingsProps} - Props
 */
const makeProps = (overrides?: Partial<AutomationSettingsProps>): AutomationSettingsProps => ({
  ticketRows: [{ ticket: "BIT-1", name: "Login" }],
  repos: [{ path: "/w", label: "W" }],
  newTicket: "",
  newName: "",
  ticketError: null,
  onNewTicketChange: jest.fn(),
  onNewNameChange: jest.fn(),
  onAddTicket: jest.fn(),
  onTicketNameChange: jest.fn(),
  onRemoveTicket: jest.fn(),
  onRepoChange: jest.fn(),
  onRemoveRepo: jest.fn(),
  onAddRepo: jest.fn(),
  ...overrides,
});

describe("AutomationSettingsComponent", () => {
  it("should forward edits", () => {
    const props = makeProps({ ticketError: "Ticket wajib diisi." });

    render(<AutomationSettingsComponent {...props} />);
    fireEvent.change(screen.getByRole("textbox", { name: "Nama task BIT-1" }), { target: { value: "x" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Ticket baru" }), { target: { value: "x" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Nama task baru" }), { target: { value: "x" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Path repo 1" }), { target: { value: "x" } });
    fireEvent.click(screen.getByRole("button", { name: "Hapus BIT-1" }));
    fireEvent.click(screen.getByRole("button", { name: "Hapus repo 1" }));
    fireEvent.click(screen.getByRole("button", { name: "Tambah repo" }));
    fireEvent.submit(screen.getByRole("form", { name: "Tambah ticket" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Ticket wajib diisi.");
    Object.values(props)
      .filter((value) => typeof value === "function")
      .forEach((handler) => expect(handler).toHaveBeenCalled());
  });
});
