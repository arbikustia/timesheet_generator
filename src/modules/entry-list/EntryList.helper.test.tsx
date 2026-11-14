import { isEntryField, readIndex } from "./EntryList.helper";

describe("EntryList helpers", () => {
  it("should accept only editable entry fields", () => {
    expect(isEntryField("task")).toBe(true);
    expect(isEntryField("remarkOverride")).toBe(false);
    expect(isEntryField(undefined)).toBe(false);
  });

  it("should read data-index or return -1", () => {
    const element = document.createElement("li");

    expect(readIndex(element)).toBe(-1);

    element.dataset.index = "3";
    expect(readIndex(element)).toBe(3);
  });
});
