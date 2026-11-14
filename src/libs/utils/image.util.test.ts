import {
  createCanvas,
  dataUrlToBlob,
  getImageFiles,
  getPixelatedSize,
  getScaledSize,
  loadImage,
  processEvidenceImage,
  toPixelRect,
} from "@/libs/utils/image.util";

import { FAKE_JPEG_DATA_URL, installFakeCanvas } from "@/fixture/canvas.fixture";

describe("size helpers", () => {
  it("should fit the longest side without upscaling", () => {
    expect(getScaledSize({ width: 3200, height: 1800 }, 1600)).toEqual({ width: 1600, height: 900 });
    expect(getScaledSize({ width: 900, height: 2000 }, 1600)).toEqual({ width: 720, height: 1600 });
    expect(getScaledSize({ width: 800, height: 600 }, 1600)).toEqual({ width: 800, height: 600 });
  });

  it("should compute the pixelation size", () => {
    expect(getPixelatedSize({ width: 1600, height: 900 }, 14)).toEqual({ width: 114, height: 64 });
    expect(getPixelatedSize({ width: 5, height: 5 }, 14)).toEqual({ width: 1, height: 1 });
  });
});

describe("processEvidenceImage", () => {
  let fake: ReturnType<typeof installFakeCanvas>;

  beforeEach(() => {
    fake = installFakeCanvas();
  });

  afterEach(() => fake.restore());

  it("should resize to 1600px and compress to JPEG on a white background", async () => {
    const result = await processEvidenceImage(new Blob(["x"], { type: "image/png" }), { blur: null });

    expect(result).toEqual({ dataUrl: FAKE_JPEG_DATA_URL, mime: "image/jpeg", w: 1600, h: 900 });
    expect(fake.contexts[0].fillStyle).toBe("#FFFFFF");
    expect(fake.contexts[0].drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 1600, 900);
    expect(fake.filters).not.toContain("blur(6px)");
    expect(HTMLCanvasElement.prototype.toDataURL).toHaveBeenCalledWith("image/jpeg", 0.8);
  });

  it("should pixelate and blur the pixels before compressing when requested", async () => {
    await processEvidenceImage(new Blob(["x"], { type: "image/png" }), { blur: { scope: "full", effect: "blur", regions: [] } });

    expect(fake.contexts).toHaveLength(2);
    expect(fake.contexts[1].drawImage).toHaveBeenCalledWith(expect.any(HTMLCanvasElement), 0, 0, 114, 64);
    expect(fake.contexts[0].clearRect).toHaveBeenCalled();
    expect(fake.filters).toContain("blur(6px)");
    expect(fake.contexts[0].filter).toBe("none");
  });
});

describe("censoring effects", () => {
  let fake: ReturnType<typeof installFakeCanvas>;

  beforeEach(() => {
    fake = installFakeCanvas();
  });

  afterEach(() => fake.restore());

  it("should pixelate with hard blocks and no Gaussian blur", async () => {
    await processEvidenceImage(new Blob(["x"], { type: "image/png" }), { blur: { scope: "full", effect: "pixelate", regions: [] } });

    expect(fake.contexts[1].drawImage).toHaveBeenCalledWith(expect.any(HTMLCanvasElement), 0, 0, 133, 75);
    expect(fake.filters).not.toContain("blur(6px)");
    expect(fake.contexts[0].imageSmoothingEnabled).toBe(true);
  });

  it("should censor only the drawn regions", async () => {
    const region = { x: 0.5, y: 0.5, width: 0.25, height: 0.5 };

    await processEvidenceImage(new Blob(["x"], { type: "image/png" }), { blur: { scope: "area", effect: "blur", regions: [region, region] } });

    // main canvas + (region canvas + its pixelation canvas) per region
    expect(fake.contexts).toHaveLength(5);
    expect(fake.contexts[1].drawImage).toHaveBeenCalledWith(expect.any(HTMLCanvasElement), 800, 450, 400, 450, 0, 0, 400, 450);
    expect(fake.contexts[0].drawImage).toHaveBeenCalledWith(expect.any(HTMLCanvasElement), 800, 450);
    expect(fake.filters).toContain("blur(6px)");
  });

  it("should clamp regions to the canvas", () => {
    expect(toPixelRect({ x: -0.1, y: 0.9, width: 2, height: 0.5 }, { width: 100, height: 50 })).toEqual({ x: 0, y: 45, width: 100, height: 5 });
    expect(toPixelRect({ x: 1, y: 1, width: 0, height: 0 }, { width: 100, height: 50 })).toEqual({ x: 99, y: 49, width: 1, height: 1 });
  });
});

describe("loadImage fallback", () => {
  it("should decode through an Image element when createImageBitmap is missing", async () => {
    const decode = jest.fn().mockResolvedValue(undefined);

    Object.defineProperty(HTMLImageElement.prototype, "decode", { value: decode, configurable: true });

    URL.createObjectURL = jest.fn(() => "blob:img");
    URL.revokeObjectURL = jest.fn();

    const image = await loadImage(new Blob(["x"]));

    image.release();
    expect(decode).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:img");
    Reflect.deleteProperty(HTMLImageElement.prototype, "decode");
  });
});

describe("createCanvas", () => {
  it("should fail clearly without a 2D context", () => {
    expect(() => createCanvas({ width: 1, height: 1 })).toThrow("Canvas tidak tersedia di browser ini.");
  });
});

describe("dataUrlToBlob", () => {
  it("should decode base64 data URLs", () => {
    const blob = dataUrlToBlob("data:image/png;base64,aGk=");

    expect(blob.type).toBe("image/png");
    expect(blob.size).toBe(2);
    expect(dataUrlToBlob("garbage").type).toBe("application/octet-stream");
  });
});

describe("getImageFiles", () => {
  it("should keep image files only", () => {
    const png = new File(["a"], "a.png", { type: "image/png" });
    const txt = new File(["b"], "b.txt", { type: "text/plain" });

    expect(getImageFiles({ files: [png, txt] })).toEqual([png]);
    expect(getImageFiles({ files: null })).toEqual([]);
    expect(getImageFiles(null)).toEqual([]);
  });
});
