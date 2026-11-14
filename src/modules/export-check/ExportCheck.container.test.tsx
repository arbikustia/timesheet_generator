import { fireEvent, renderWithStore, screen } from "@/libs/unit-test";

import { makeDocStore } from "@/fixture/timesheet.fixture";

import ExportCheckContainer from "./ExportCheck.container";

describe("ExportCheckContainer", () => {
  it("should show the October check and navigate on click", () => {
    const onNavigate = jest.fn();

    renderWithStore(<ExportCheckContainer onNavigate={onNavigate} />, makeDocStore().getState());

    expect(screen.getByText("22 / 22")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Error (3)" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Error: Tanda tangan Tribe Leader belum diunggah." }));
    expect(onNavigate).toHaveBeenCalledWith({ kind: "signature", key: "tribeLeader" });
  });
});
