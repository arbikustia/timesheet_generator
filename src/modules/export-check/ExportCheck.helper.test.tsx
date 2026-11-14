import { fireEvent, render, screen } from "@/libs/unit-test";

import { getCheckStatusText, getCheckStatusType, renderIssue, renderIssueGroup } from "./ExportCheck.helper";

describe("ExportCheck helpers", () => {
  it("should describe the overall status", () => {
    expect(getCheckStatusText(2, 1)).toBe("2 error harus diperbaiki sebelum export PDF.");
    expect(getCheckStatusText(0, 3)).toBe("Siap export · 3 peringatan (tidak memblokir).");
    expect(getCheckStatusText(0, 0)).toBe("Semua beres — siap export PDF.");
    expect(getCheckStatusType(1, 0)).toBe("error");
    expect(getCheckStatusType(0, 1)).toBe("warning");
    expect(getCheckStatusType(0, 0)).toBe("success");
  });

  it("should render clickable and plain items", () => {
    const onIssueClick = jest.fn();

    render(
      <ul>
        {renderIssue({ id: "a", level: "error", message: "Task kosong.", target: { kind: "entry", entryId: "e1" } }, onIssueClick)}
        {renderIssue({ id: "size", level: "warning", message: "Terlalu besar.", target: null }, onIssueClick)}
      </ul>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Error: Task kosong." }));

    expect(onIssueClick).toHaveBeenCalled();
    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(screen.getByText("Terlalu besar.")).toBeInTheDocument();
  });

  it("should render nothing for an empty group", () => {
    expect(renderIssueGroup("warning", [], jest.fn())).toBeNull();
  });
});
