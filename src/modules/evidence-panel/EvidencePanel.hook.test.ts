import { act, createStoreWrapper, renderHook } from "@/libs/unit-test";

import { FAKE_JPEG_DATA_URL, installFakeCanvas } from "@/fixture/canvas.fixture";
import { loadOctoberDoc, makeDocStore, SAMPLE_IMAGE } from "@/fixture/timesheet.fixture";

import { createEvidence, selectUploadFiles, toCodeBlurItems, useEvidencePanel } from "./EvidencePanel.hook";

const png = (name: string): File => new File(["x"], name, { type: "image/png" });

describe("selectUploadFiles", () => {
  it("should keep accepted images up to the free slots and explain what was skipped", () => {
    const setError = jest.fn();

    expect(selectUploadFiles([png("a.png"), png("b.png")], 2, setError)).toHaveLength(2);
    expect(setError).not.toHaveBeenCalled();

    expect(selectUploadFiles([png("a.png"), png("b.png")], 1, setError).map((file) => file.name)).toEqual(["a.png"]);
    expect(setError).toHaveBeenLastCalledWith("Maksimal 2 gambar per tanggal.");

    expect(selectUploadFiles([new File(["x"], "a.gif", { type: "image/gif" })], 2, setError)).toEqual([]);
    expect(setError).toHaveBeenLastCalledWith("Gunakan gambar PNG, JPG atau WebP.");

    expect(selectUploadFiles([png("a.png")], 0, setError)).toEqual([]);
  });
});

describe("createEvidence", () => {
  it("should mark censored screenshots as blurred and keep a given id", async () => {
    const fake = installFakeCanvas();
    const blur = { scope: "full" as const, effect: "blur" as const, regions: [] };

    await expect(createEvidence({ file: png("a.png"), name: "a.png", sensitivity: "code", blur, id: "fixed" })).resolves.toEqual({
      id: "fixed",
      name: "a.png",
      dataUrl: FAKE_JPEG_DATA_URL,
      mime: "image/jpeg",
      w: 1600,
      h: 900,
      sensitivity: "code",
      blurred: true,
    });
    await expect(createEvidence({ file: png("b.png"), name: "b.png", sensitivity: "plain", blur: null })).resolves.toMatchObject({ sensitivity: "plain", blurred: false });
    fake.restore();
  });
});

describe("useEvidencePanel", () => {
  it("should warn when the document is larger than 15 MB", () => {
    const doc = loadOctoberDoc();

    doc.evidence["2026-10-01"] = [{ ...SAMPLE_IMAGE, dataUrl: `data:image/jpeg;base64,${"A".repeat(16 * 1024 * 1024)}` }];

    const { result } = renderHook(() => useEvidencePanel(), { wrapper: createStoreWrapper(makeDocStore(doc)) });

    expect(result.current.isTooLarge).toBe(true);
    expect(result.current.sizeLabel).toBe("16.0 MB");
    expect(result.current.blocks).toHaveLength(22);
  });
});

describe("blur queue", () => {
  it("should build editor items for code screenshots", () => {
    const [item] = toCodeBlurItems("2026-10-01", [new File(["x"], "", { type: "image/png" })], "img");

    expect(item).toMatchObject({ date: "2026-10-01", name: "clipboard-2026-10-01.jpg", isCode: true, sensitivity: "code", replaceId: "img" });
  });

  it("should ignore apply/cancel with an empty queue and replace via the editor", async () => {
    const fake = installFakeCanvas();
    const doc = loadOctoberDoc();

    URL.createObjectURL = jest.fn(() => "blob:x");
    URL.revokeObjectURL = jest.fn();
    doc.evidence["2026-10-01"] = [SAMPLE_IMAGE];

    const store = makeDocStore(doc);
    const { result } = renderHook(() => useEvidencePanel(), { wrapper: createStoreWrapper(store) });

    act(() => result.current.onBlurApply({ scope: "full", effect: "pixelate", regions: [] }));
    act(() => result.current.onBlurCancel());
    expect(result.current.blurRequest).toBeNull();
    expect(result.current.error).toBeNull();
    fake.restore();
  });
});
