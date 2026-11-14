import test from "@/libs/unit-test";

import AutomationSettingsComponent from "./AutomationSettings.component";

describe("AutomationSettingsComponent Snapshot Test", () => {
  test.assertSnapshots(AutomationSettingsComponent, [
    {
      desc: "should render one ticket and one repository",
      props: {
        ticketRows: [{ ticket: "BIT-1", name: "Login" }],
        repos: [{ path: "/work/fe", label: "FE" }],
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
      },
    },
  ]);
});
