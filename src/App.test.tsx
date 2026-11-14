import { render, screen } from "@/libs/unit-test";

import App from "./App";

describe("App", () => {
  it("should render the application title", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "Timesheet Builder" })).toBeInTheDocument();
  });
});
