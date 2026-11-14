import { isProfileTextField, isSignatureKey, isWorkHourField, parseTemplates } from "./ProfileSettings.util";

describe("ProfileSettings util", () => {
  it("should guard data attributes", () => {
    expect(isProfileTextField("squad")).toBe(true);
    expect(isProfileTextField("signDate")).toBe(false);
    expect(isSignatureKey("tribeLeader")).toBe(true);
    expect(isSignatureKey(undefined)).toBe(false);
    expect(isWorkHourField("end")).toBe(true);
    expect(isWorkHourField("middle")).toBe(false);
  });

  it("should split templates by line and keep blank lines while typing", () => {
    expect(parseTemplates("")).toEqual([]);
    expect(parseTemplates("A\nB\n")).toEqual(["A", "B", ""]);
  });
});
