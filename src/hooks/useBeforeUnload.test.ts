import { renderHook } from "@/libs/unit-test";

import { useBeforeUnload } from "@/hooks/useBeforeUnload";

describe("useBeforeUnload", () => {
  it("should block unload only while enabled", () => {
    const { rerender, unmount } = renderHook(({ isEnabled }) => useBeforeUnload(isEnabled), { initialProps: { isEnabled: true } });
    const blocked = new Event("beforeunload", { cancelable: true });

    window.dispatchEvent(blocked);
    expect(blocked.defaultPrevented).toBe(true);

    rerender({ isEnabled: false });
    const allowed = new Event("beforeunload", { cancelable: true });

    window.dispatchEvent(allowed);
    expect(allowed.defaultPrevented).toBe(false);
    unmount();
  });
});
