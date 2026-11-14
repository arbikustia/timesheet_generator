import { renderHook } from "@/libs/unit-test";

import { usePrintTitle } from "@/hooks/usePrintTitle";

describe("usePrintTitle", () => {
  it("should swap the title while printing and restore it after", () => {
    document.title = "Timesheet Builder";

    const { rerender, unmount } = renderHook(({ title }) => usePrintTitle(title), { initialProps: { title: "A October" } });

    rerender({ title: "BHN II - Timesheet October" });
    window.dispatchEvent(new Event("beforeprint"));
    expect(document.title).toBe("BHN II - Timesheet October");

    window.dispatchEvent(new Event("afterprint"));
    window.dispatchEvent(new Event("afterprint"));
    expect(document.title).toBe("Timesheet Builder");

    unmount();
    window.dispatchEvent(new Event("beforeprint"));
    expect(document.title).toBe("Timesheet Builder");
  });
});
