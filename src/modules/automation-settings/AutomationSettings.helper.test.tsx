import { render, screen } from "@/libs/unit-test";

import { renderRepoRow, renderTicketRow } from "./AutomationSettings.helper";
import type { AutomationSettingsProps } from "./AutomationSettings.type";

const PROPS: AutomationSettingsProps = {
  ticketRows: [],
  repos: [],
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
};

describe("AutomationSettings helpers", () => {
  it("should render editable rows with data attributes", () => {
    render(
      <ul>
        {renderTicketRow({ ticket: "BIT-1", name: "Login" }, PROPS)}
        {renderRepoRow({ path: "/w", label: "W" }, 0, PROPS)}
      </ul>,
    );

    expect(screen.getByRole("textbox", { name: "Nama task BIT-1" })).toHaveAttribute("data-ticket", "BIT-1");
    expect(screen.getByRole("textbox", { name: "Label repo 1" })).toHaveAttribute("data-field", "label");
  });
});
