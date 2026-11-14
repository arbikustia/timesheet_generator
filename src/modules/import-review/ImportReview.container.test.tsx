import { fireEvent, renderWithStore, screen } from "@/libs/unit-test";

import { selectDoc } from "@/store/timesheet.slice";

import { loadReviewDoc, makeDocStore } from "@/fixture/timesheet.fixture";

import ImportReviewContainer from "./ImportReview.container";

/**
 * Render the review panel with two pending entries.
 * @returns {ReturnType<typeof renderWithStore>["store"]} - Store
 */
const renderReview = (): ReturnType<typeof renderWithStore>["store"] =>
  renderWithStore(<ImportReviewContainer />, makeDocStore(loadReviewDoc()).getState()).store;

/**
 * Entry by id.
 * @param {ReturnType<typeof renderReview>} store - Store
 * @param {string} id - Entry id
 * @returns {ReturnType<typeof selectDoc>["entries"][number] | undefined} - Entry
 */
const entryOf = (store: ReturnType<typeof renderReview>, id: string) => selectDoc(store.getState()).entries.find((entry) => entry.id === id);

describe("ImportReviewContainer", () => {
  it("should edit then accept, learning the ticket name", () => {
    const store = renderReview();

    expect(screen.getByText(/2 entri otomatis belum direview/)).toBeInTheDocument();

    fireEvent.change(screen.getAllByRole("textbox", { name: "Nama task" })[0], { target: { value: "Fixing case transfer" } });
    fireEvent.click(screen.getAllByRole("button", { name: "Terima" })[0]);

    expect(entryOf(store, "git-1")).toMatchObject({ task: "Fixing case transfer", reviewed: true });
    expect(selectDoc(store.getState()).automation.ticketMap).toEqual({ "BIT-231": "Fixing case transfer" });
    expect(screen.getByText(/1 entri otomatis belum direview/)).toBeInTheDocument();
  });

  it("should merge, reject and accept a whole week", () => {
    const store = renderReview();

    fireEvent.change(screen.getByRole("combobox", { name: "Gabung dengan baris lain" }), { target: { value: "manual" } });
    expect(entryOf(store, "git-1")).toBeUndefined();
    expect(entryOf(store, "manual")?.refs?.files).toEqual(["src/a.ts"]);

    fireEvent.click(screen.getByRole("button", { name: "Terima semua minggu ini (1)" }));
    expect(entryOf(store, "claude-1")?.reviewed).toBe(true);
    expect(screen.getByText("Tidak ada entri otomatis yang menunggu review.")).toBeInTheDocument();
  });

  it("should reject an entry and show its details", () => {
    const store = renderReview();

    expect(screen.getByText("Aktivitas terdeteksi 08:12–17:40")).toBeInTheDocument();
    expect(screen.getByText("Claude Code: refactor notes api")).toBeInTheDocument();
    expect(screen.getByText("1 file tersentuh")).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: "Tolak" })[1]);
    expect(entryOf(store, "claude-1")).toBeUndefined();
  });
});
