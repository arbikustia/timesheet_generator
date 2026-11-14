import { fireEvent, render, screen } from "@/libs/unit-test";

import { renderOverrideItem } from "./DayOverrides.helper";

describe("renderOverrideItem", () => {
  it("should render the label, the entries hint and the remove button", () => {
    const onRemove = jest.fn();

    render(
      <ul>
        {renderOverrideItem(
          { date: "2026-10-20", dateLabel: "Sel, 20/10/2026", override: { type: "leave", label: "Cuti" }, hasEntries: true },
          onRemove,
        )}
      </ul>,
    );

    expect(screen.getByText("Cuti")).toBeInTheDocument();
    expect(screen.getByText(/Ada aktivitas/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Hapus Sel, 20/10/2026" }));
    expect(onRemove).toHaveBeenCalled();
  });

  it("should omit the hint without entries", () => {
    render(
      <ul>
        {renderOverrideItem(
          { date: "2026-10-01", dateLabel: "Kam, 01/10/2026", override: { type: "holiday", label: "Public Holiday" }, hasEntries: false },
          jest.fn(),
        )}
      </ul>,
    );

    expect(screen.queryByText(/Ada aktivitas/)).toBeNull();
  });
});
