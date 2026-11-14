import { renderWithStore, screen } from "@/libs/unit-test";

import App from "./App";

describe("App", () => {
  it("should render the Timesheet Builder", () => {
    renderWithStore(<App />);

    expect(screen.getByRole("heading", { name: "Timesheet Builder", level: 1 })).toBeInTheDocument();
    expect(screen.getByTestId("timesheet-document")).toBeInTheDocument();
  });
});
