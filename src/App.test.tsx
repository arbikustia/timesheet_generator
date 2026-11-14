import { renderWithStore, screen, within } from "@/libs/unit-test";

import App from "./App";

describe("App", () => {
  it("should render the Timesheet Builder", () => {
    renderWithStore(<App />);

    expect(screen.getByRole("heading", { name: "Timesheet Builder", level: 1 })).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "Pratinjau dokumen" })).getByTestId("timesheet-document")).toBeInTheDocument();
    expect(within(screen.getByTestId("print-root")).getByTestId("timesheet-document")).toBeInTheDocument();
  });
});
