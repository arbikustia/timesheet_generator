import { fireEvent, render, screen } from "@/libs/unit-test";

import { getConfirmMessage, renderConfirmFooter } from "./PeriodPanel.helper";
import type { PeriodPanelProps } from "./PeriodPanel.type";

const PROPS = {
  onCancel: jest.fn(),
  onConfirmMove: jest.fn(),
  onConfirmReset: jest.fn(),
  onConfirmNextMonth: jest.fn(),
} as Pick<PeriodPanelProps, "onCancel" | "onConfirmMove" | "onConfirmReset" | "onConfirmNextMonth">;

describe("PeriodPanel helpers", () => {
  it("should describe a period change and the next-month start", () => {
    expect(getConfirmMessage({ kind: "change-period", period: { year: 2026, month: 11 } }, "November 2026")).toContain(
      "November 2026",
    );
    expect(getConfirmMessage({ kind: "next-month" }, "November 2026")).toContain("Mulai November 2026");
  });

  it("should render move/reset/cancel for a period change", () => {
    render(<div>{renderConfirmFooter(PROPS as PeriodPanelProps, { kind: "change-period", period: { year: 2026, month: 11 } })}</div>);

    fireEvent.click(screen.getByRole("button", { name: "Pindahkan tanggal" }));
    fireEvent.click(screen.getByRole("button", { name: "Mulai periode baru" }));
    fireEvent.click(screen.getByRole("button", { name: "Batal" }));

    expect(PROPS.onConfirmMove).toHaveBeenCalled();
    expect(PROPS.onConfirmReset).toHaveBeenCalled();
    expect(PROPS.onCancel).toHaveBeenCalled();
  });

  it("should render the next-month confirmation", () => {
    render(<div>{renderConfirmFooter(PROPS as PeriodPanelProps, { kind: "next-month" })}</div>);

    fireEvent.click(screen.getByRole("button", { name: "Mulai bulan berikutnya" }));

    expect(PROPS.onConfirmNextMonth).toHaveBeenCalled();
  });
});
