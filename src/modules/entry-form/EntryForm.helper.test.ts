import { filterTaskOption, toTaskOptions } from "./EntryForm.helper";

describe("EntryForm helpers", () => {
  it("should match suggestions case-insensitively", () => {
    expect(filterTaskOption("ADMIN", { value: "Tech debt case admin list" })).toBe(true);
    expect(filterTaskOption("basket", { value: "Tech debt case admin list" })).toBe(false);
    expect(filterTaskOption("x")).toBe(false);
  });

  it("should map tasks to options", () => {
    expect(toTaskOptions(["A", "B"])).toEqual([{ value: "A" }, { value: "B" }]);
  });
});
