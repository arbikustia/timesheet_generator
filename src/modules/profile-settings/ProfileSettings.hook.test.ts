import { createStoreWrapper, renderHook } from "@/libs/unit-test";

import { makeDocStore } from "@/fixture/timesheet.fixture";

import { useProfileSettings } from "./ProfileSettings.hook";

describe("useProfileSettings", () => {
  it("should expose the profile, templates text and the period date range", () => {
    const store = makeDocStore();
    const { result } = renderHook(() => useProfileSettings(), { wrapper: createStoreWrapper(store) });

    expect(result.current.profile.consultantName).toBe("Arbi Kustia");
    expect(result.current.templatesText).toBe("");
    expect(result.current.minDate).toBe("2026-10-01");
    expect(result.current.maxDate).toBe("2026-10-31");
    expect(result.current.signatureError).toBeNull();
  });
});
