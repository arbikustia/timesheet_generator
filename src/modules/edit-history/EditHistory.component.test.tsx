import { fireEvent, render, screen } from "@/libs/unit-test";

import EditHistoryComponent from "./EditHistory.component";

describe("EditHistoryComponent", () => {
  it("should call the handlers of enabled buttons", () => {
    const onUndo = jest.fn();
    const onRedo = jest.fn();

    render(<EditHistoryComponent canUndo canRedo onUndo={onUndo} onRedo={onRedo} />);
    fireEvent.click(screen.getByRole("button", { name: "Urungkan" }));
    fireEvent.click(screen.getByRole("button", { name: "Ulangi" }));

    expect(onUndo).toHaveBeenCalled();
    expect(onRedo).toHaveBeenCalled();
  });

  it("should disable unavailable steps", () => {
    render(<EditHistoryComponent canUndo={false} canRedo={false} onUndo={jest.fn()} onRedo={jest.fn()} />);

    expect(screen.getByRole("button", { name: "Urungkan" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Ulangi" })).toBeDisabled();
  });
});
