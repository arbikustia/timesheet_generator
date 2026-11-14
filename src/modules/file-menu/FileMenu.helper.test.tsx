import { fireEvent, render, screen } from "@/libs/unit-test";

import { renderNotice } from "./FileMenu.helper";

describe("renderNotice", () => {
  it("should announce errors as alerts and close on demand", () => {
    const onDismiss = jest.fn();

    render(renderNotice({ type: "error", text: "Gagal menyimpan" }, onDismiss));

    expect(screen.getByRole("alert")).toHaveTextContent("Gagal menyimpan");

    fireEvent.click(screen.getByRole("button", { name: "Tutup pesan" }));
    expect(onDismiss).toHaveBeenCalled();
  });

  it("should announce success as status", () => {
    render(renderNotice({ type: "success", text: "Tersimpan: a.json" }, jest.fn()));

    expect(screen.getByRole("status")).toHaveTextContent("Tersimpan: a.json");
  });
});
