import { buildBlurSpec, canApplySpec, isUsableRegion, toFractionPoint, toRegion } from "./BlurEditor.util";

const BOX = { left: 100, top: 50, width: 400, height: 200 };

describe("BlurEditor util", () => {
  it("should convert pointer positions to clamped fractions", () => {
    expect(toFractionPoint(300, 150, BOX)).toEqual({ x: 0.5, y: 0.5 });
    expect(toFractionPoint(0, 400, BOX)).toEqual({ x: 0, y: 1 });
    expect(toFractionPoint(1, 1, { ...BOX, width: 0 })).toBeNull();
  });

  it("should build a region in any drag direction and drop tiny ones", () => {
    expect(toRegion({ x: 0.75, y: 0.5 }, { x: 0.25, y: 0.25 })).toEqual({ x: 0.25, y: 0.25, width: 0.5, height: 0.25 });
    expect(isUsableRegion({ x: 0, y: 0, width: 0.2, height: 0.005 })).toBe(false);
    expect(isUsableRegion({ x: 0, y: 0, width: 0.2, height: 0.2 })).toBe(true);
  });

  it("should require a region for the area scope only", () => {
    const region = { x: 0, y: 0, width: 0.5, height: 0.5 };

    expect(canApplySpec("full", [])).toBe(true);
    expect(canApplySpec("area", [])).toBe(false);
    expect(canApplySpec("area", [region])).toBe(true);
    expect(buildBlurSpec("full", "pixelate", [region])).toEqual({ scope: "full", effect: "pixelate", regions: [] });
    expect(buildBlurSpec("area", "blur", [region]).regions).toEqual([region]);
  });
});
