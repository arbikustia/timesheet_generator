import { createStoreWrapper, renderHook } from "@/libs/unit-test";

import { FAKE_JPEG_DATA_URL, installFakeCanvas } from "@/fixture/canvas.fixture";
import { loadOctoberDoc, makeDocStore, SAMPLE_IMAGE } from "@/fixture/timesheet.fixture";

import { createEvidence, selectUploadFiles, useEvidencePanel } from "./EvidencePanel.hook";

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
  it("should mark code screenshots as blurred and keep a given id", async () => {
    const fake = installFakeCanvas();

    await expect(createEvidence(png("a.png"), "a.png", true, "fixed")).resolves.toEqual({
      id: "fixed",
      name: "a.png",
      dataUrl: FAKE_JPEG_DATA_URL,
      mime: "image/jpeg",
      w: 1600,
      h: 900,
      sensitivity: "code",
      blurred: true,
    });
    await expect(createEvidence(png("b.png"), "b.png", false)).resolves.toMatchObject({ sensitivity: "plain", blurred: false });
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
