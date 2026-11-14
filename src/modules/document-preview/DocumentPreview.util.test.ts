import { getFitWidthZoom } from "./DocumentPreview.util";

describe("getFitWidthZoom", () => {
  it("should fit the page to the width within bounds", () => {
    expect(getFitWidthZoom(0)).toBe(1);
    expect(getFitWidthZoom(793.7 + 32)).toBeCloseTo(1);
    expect(getFitWidthZoom(400)).toBeCloseTo((400 - 32) / 793.7);
    expect(getFitWidthZoom(5000)).toBe(1.5);
    expect(getFitWidthZoom(40)).toBe(0.2);
  });
});
