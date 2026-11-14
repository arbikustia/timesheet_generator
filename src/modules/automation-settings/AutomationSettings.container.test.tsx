import { fireEvent, renderWithStore, screen } from "@/libs/unit-test";

import { selectDoc } from "@/store/timesheet.slice";

import { loadReviewDoc, makeDocStore } from "@/fixture/timesheet.fixture";

import AutomationSettingsContainer from "./AutomationSettings.container";

/**
 * Render the editors with the review fixture.
 * @returns {ReturnType<typeof renderWithStore>["store"]} - Store
 */
const renderSettings = (): ReturnType<typeof renderWithStore>["store"] =>
  renderWithStore(<AutomationSettingsContainer />, makeDocStore(loadReviewDoc()).getState()).store;

describe("AutomationSettingsContainer", () => {
  it("should add, rename and remove ticket names", () => {
    const store = renderSettings();
    const ticketMap = (): Record<string, string> => selectDoc(store.getState()).automation.ticketMap;

    fireEvent.submit(screen.getByRole("form", { name: "Tambah ticket" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Ticket wajib diisi.");

    fireEvent.change(screen.getByRole("textbox", { name: "Ticket baru" }), { target: { value: "bit-231" } });
    fireEvent.submit(screen.getByRole("form", { name: "Tambah ticket" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Nama task wajib diisi.");

    fireEvent.change(screen.getByRole("textbox", { name: "Nama task baru" }), { target: { value: "Fixing case transfer" } });
    fireEvent.submit(screen.getByRole("form", { name: "Tambah ticket" }));
    expect(ticketMap()).toEqual({ "BIT-231": "Fixing case transfer" });
    expect(selectDoc(store.getState()).entries[1].task).toBe("Fixing case transfer");
    expect(screen.getByRole("textbox", { name: "Ticket baru" })).toHaveValue("");

    fireEvent.change(screen.getByRole("textbox", { name: "Nama task BIT-231" }), { target: { value: "" } });
    expect(ticketMap()).toEqual({ "BIT-231": "" });

    fireEvent.click(screen.getByRole("button", { name: "Hapus BIT-231" }));
    expect(ticketMap()).toEqual({});
  });

  it("should add, edit and remove repositories", () => {
    const store = renderSettings();
    const repos = (): ReturnType<typeof selectDoc>["automation"]["repos"] => selectDoc(store.getState()).automation.repos;

    fireEvent.click(screen.getByRole("button", { name: "Tambah repo" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Path repo 1" }), { target: { value: "/work/fe" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Label repo 1" }), { target: { value: "FE" } });
    expect(repos()).toEqual([{ path: "/work/fe", label: "FE" }]);

    fireEvent.click(screen.getByRole("button", { name: "Hapus repo 1" }));
    expect(repos()).toEqual([]);
  });
});
