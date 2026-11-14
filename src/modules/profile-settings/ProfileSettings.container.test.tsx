import { fireEvent, renderWithStore, screen, waitFor } from "@/libs/unit-test";

import { selectDoc } from "@/store/timesheet.slice";

import { loadOctoberDoc } from "@/fixture/timesheet.fixture";

import ProfileSettingsContainer from "./ProfileSettings.container";

/**
 * Render settings with the October document.
 * @returns {ReturnType<typeof renderWithStore>["store"]} - Store
 */
const renderSettings = (): ReturnType<typeof renderWithStore>["store"] =>
  renderWithStore(<ProfileSettingsContainer />, { timesheet: { doc: loadOctoberDoc() } }).store;

describe("ProfileSettingsContainer", () => {
  it("should update text fields, sign date, default hours and templates", () => {
    const store = renderSettings();

    fireEvent.change(screen.getByLabelText("Footer cover — perusahaan"), { target: { value: "PT NEGERI EMAS PERKASA" } });
    fireEvent.change(screen.getByLabelText("Tanggal tanda tangan"), { target: { value: "2026-10-29" } });
    fireEvent.change(screen.getByLabelText("Tanggal tanda tangan"), { target: { value: "" } });
    fireEvent.change(screen.getByLabelText("Jam selesai default"), { target: { value: "18:00" } });
    fireEvent.change(screen.getByLabelText("Template task"), { target: { value: "Daily standup\nCode review" } });

    const { profile } = selectDoc(store.getState());

    expect(profile.footerCompany).toBe("PT NEGERI EMAS PERKASA");
    expect(profile.signDate).toBe("2026-10-29");
    expect(profile.defaults.end).toBe("18:00");
    expect(profile.taskTemplates).toEqual(["Daily standup", "Code review"]);
  });

  it("should upload and remove a signature image", async () => {
    const store = renderSettings();
    const file = new File(["sig"], "sig.png", { type: "image/png" });

    fireEvent.change(screen.getByLabelText("Unggah tanda tangan Tribe Leader"), { target: { files: [file] } });

    await waitFor(() => expect(selectDoc(store.getState()).profile.signatures.tribeLeader).toBe("data:image/png;base64,c2ln"));

    fireEvent.click(screen.getByRole("button", { name: "Hapus" }));
    expect(selectDoc(store.getState()).profile.signatures.tribeLeader).toBeNull();
  });

  it("should reject unsupported images and ignore an empty selection", () => {
    const store = renderSettings();
    const input = screen.getByLabelText("Unggah tanda tangan Prepared by (konsultan)");

    fireEvent.change(input, { target: { files: [] } });
    expect(screen.queryByRole("alert")).toBeNull();

    fireEvent.change(input, { target: { files: [new File(["x"], "x.gif", { type: "image/gif" })] } });
    expect(screen.getByRole("alert")).toHaveTextContent("Gunakan gambar PNG, JPG atau WebP.");
    expect(selectDoc(store.getState()).profile.signatures.preparedBy).toBeNull();
  });
});
