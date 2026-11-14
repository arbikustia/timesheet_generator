import { act, fireEvent, renderWithStore, screen, waitFor } from "@/libs/unit-test";

import { createTimesheetState, selectDoc } from "@/store/timesheet.slice";

import { FAKE_JPEG_DATA_URL, installFakeCanvas } from "@/fixture/canvas.fixture";
import { loadOctoberDoc, SAMPLE_IMAGE } from "@/fixture/timesheet.fixture";

import EvidencePanelContainer from "./EvidencePanel.container";

const PNG = (): File => new File(["png"], "board.png", { type: "image/png" });

/**
 * Render the panel with the first three October entries.
 * @returns {ReturnType<typeof renderWithStore>["store"]} - Store
 */
const renderPanel = (): ReturnType<typeof renderWithStore>["store"] => {
  const doc = loadOctoberDoc();

  doc.entries = doc.entries.slice(0, 3);

  return renderWithStore(<EvidencePanelContainer />, { timesheet: createTimesheetState(doc) }).store;
};

/**
 * Images of a date in the store.
 * @param {ReturnType<typeof renderPanel>} store - Store
 * @param {string} date - ISO date
 * @returns {import("@/types/timesheet.type").Evidence[]} - Images
 */
const imagesOf = (store: ReturnType<typeof renderPanel>, date: string) => selectDoc(store.getState()).evidence[date] ?? [];

let fake: ReturnType<typeof installFakeCanvas>;

beforeEach(() => {
  fake = installFakeCanvas();
});

afterEach(() => fake.restore());

describe("EvidencePanelContainer", () => {
  it("should list the dates with activities and the document size", () => {
    renderPanel();

    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(screen.getByTestId("document-size")).toHaveTextContent(/Ukuran dokumen: \d+ KB/);
  });

  it("should upload a plain image without blur", async () => {
    const store = renderPanel();

    fireEvent.change(screen.getByLabelText("Unggah evidence kiri Kam, 01/10/2026"), { target: { files: [PNG()] } });

    await waitFor(() => expect(imagesOf(store, "2026-10-01")).toHaveLength(1));
    expect(imagesOf(store, "2026-10-01")[0]).toMatchObject({
      name: "board.png",
      dataUrl: FAKE_JPEG_DATA_URL,
      mime: "image/jpeg",
      w: 1600,
      h: 900,
      sensitivity: "plain",
      blurred: false,
    });
    expect(fake.filters).not.toContain("blur(6px)");
  });

  it("should blur uploads when they are marked as code and keep at most two images", async () => {
    const store = renderPanel();

    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.drop(screen.getAllByText("Kiri: tarik gambar atau klik")[0].closest("label") as HTMLElement, {
      dataTransfer: { files: [PNG(), PNG(), PNG()] },
    });

    await waitFor(() => expect(imagesOf(store, "2026-10-01")).toHaveLength(2));
    expect(imagesOf(store, "2026-10-01").every((image) => image.sensitivity === "code" && image.blurred)).toBe(true);
    expect(fake.filters).toContain("blur(6px)");
    expect(screen.getByRole("alert")).toHaveTextContent("Maksimal 2 gambar per tanggal.");
  });

  it("should paste a screenshot into the active date and blur it", async () => {
    const store = renderPanel();
    const block = screen.getByRole("listitem", { name: "Evidence Jum, 02/10/2026" });

    fireEvent.click(block);
    fireEvent.paste(block, { clipboardData: { files: [new File(["x"], "", { type: "image/png" })] } });

    await waitFor(() => expect(imagesOf(store, "2026-10-02")).toHaveLength(1));
    expect(imagesOf(store, "2026-10-02")[0]).toMatchObject({ name: "clipboard-2026-10-02.jpg", sensitivity: "code", blurred: true });
    expect(block).toHaveAttribute("aria-current", "true");
  });

  it("should ignore a paste without images", () => {
    const store = renderPanel();

    fireEvent.paste(screen.getAllByRole("listitem")[0], { clipboardData: { files: [] } });

    expect(selectDoc(store.getState()).evidence).toEqual({});
  });

  it("should reject unsupported files", async () => {
    const store = renderPanel();

    fireEvent.change(screen.getByLabelText("Unggah evidence kiri Kam, 01/10/2026"), {
      target: { files: [new File(["gif"], "a.gif", { type: "image/gif" })] },
    });

    expect(await screen.findByRole("alert")).toHaveTextContent("Gunakan gambar PNG, JPG atau WebP.");
    expect(imagesOf(store, "2026-10-01")).toEqual([]);
  });

  it("should report processing failures", async () => {
    fake.restore();
    const store = renderPanel();

    fireEvent.change(screen.getByLabelText("Unggah evidence kiri Kam, 01/10/2026"), { target: { files: [PNG()] } });

    expect(await screen.findByRole("alert")).toHaveTextContent("Gagal memproses gambar");
    expect(imagesOf(store, "2026-10-01")).toEqual([]);
    fake = installFakeCanvas();
  });
});

describe("EvidencePanelContainer — existing images", () => {
  /**
   * Render with two plain images on 01/10.
   * @returns {ReturnType<typeof renderWithStore>["store"]} - Store
   */
  const renderWithImages = (): ReturnType<typeof renderWithStore>["store"] => {
    const doc = loadOctoberDoc();

    doc.entries = doc.entries.slice(0, 1);
    doc.evidence["2026-10-01"] = [
      { ...SAMPLE_IMAGE, id: "a", name: "a.png", dataUrl: "data:image/png;base64,aGk=" },
      { ...SAMPLE_IMAGE, id: "b", name: "b.png" },
    ];

    return renderWithStore(<EvidencePanelContainer />, { timesheet: createTimesheetState(doc) }).store;
  };

  it("should swap, replace, blur and remove images", async () => {
    const store = renderWithImages();
    const ids = (): string[] => imagesOf(store, "2026-10-01").map((image) => image.id);

    fireEvent.click(screen.getByRole("button", { name: "Tukar posisi Kam, 01/10/2026" }));
    expect(ids()).toEqual(["b", "a"]);

    fireEvent.change(screen.getByLabelText("Ganti gambar kiri Kam, 01/10/2026"), { target: { files: [PNG()] } });
    await waitFor(() => expect(imagesOf(store, "2026-10-01")[0].name).toBe("board.png"));
    expect(ids()).toEqual(["b", "a"]);

    fireEvent.click(screen.getByRole("button", { name: "Blur gambar kanan Kam, 01/10/2026" }));
    await waitFor(() => expect(imagesOf(store, "2026-10-01")[1]).toMatchObject({ id: "a", sensitivity: "code", blurred: true }));
    expect(screen.getByText("Diblur")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Hapus gambar kiri Kam, 01/10/2026" }));
    expect(ids()).toEqual(["a"]);
  });

  it("should reject an unsupported replacement and ignore an empty selection", async () => {
    const store = renderWithImages();
    const input = screen.getByLabelText("Ganti gambar kiri Kam, 01/10/2026");

    fireEvent.change(input, { target: { files: [] } });
    fireEvent.change(input, { target: { files: [new File(["x"], "x.txt", { type: "text/plain" })] } });

    expect(await screen.findByRole("alert")).toHaveTextContent("Gunakan gambar PNG, JPG atau WebP.");
    expect(imagesOf(store, "2026-10-01")[0].id).toBe("a");

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Tutup pesan" }));
    });
  });
});
