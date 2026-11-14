import { render, screen } from "@/libs/unit-test";

import { renderRegion, toRegionStyle } from "./BlurEditor.helper";

describe("BlurEditor helpers", () => {
  it("should position a region in percent", () => {
    expect(toRegionStyle({ x: 0.1, y: 0.2, width: 0.5, height: 0.25 })).toEqual({ left: "10%", top: "20%", width: "50%", height: "25%" });
  });

  it("should render a region box", () => {
    render(<div>{renderRegion({ x: 0, y: 0, width: 0.5, height: 0.5 }, 0)}</div>);

    expect(screen.getByTestId("blur-region")).toHaveStyle({ width: "50%" });
  });
});
