import { openDocumentInNewTab } from "./ExportPdf.util";

describe("openDocumentInNewTab", () => {
  it("should copy the print copy and styles into a new tab", () => {
    const tabDocument = document.implementation.createHTMLDocument("");
    const open = jest.fn(() => ({ document: tabDocument }) as Window);
    const source = document.createElement("div");

    source.innerHTML = '<div class="timesheet-document"><section data-page-kind="sheet">TIMESHEET</section></div>';

    expect(openDocumentInNewTab(source, "BHN II - Timesheet October", { open })).toBe(true);
    expect(open).toHaveBeenCalledWith("", "_blank");
    expect(tabDocument.title).toBe("BHN II - Timesheet October");
    expect(tabDocument.head.querySelector("style")?.textContent).toContain("@page { size: A4; margin: 0; }");
    expect(tabDocument.body.querySelector("[data-page-kind]")?.textContent).toBe("TIMESHEET");
  });

  it("should fail when the pop-up is blocked or nothing is rendered", () => {
    const open = jest.fn(() => null);

    expect(openDocumentInNewTab(document.createElement("div"), "x", { open })).toBe(false);
    expect(openDocumentInNewTab(null, "x", { open })).toBe(false);
    expect(open).toHaveBeenCalledTimes(1);
  });
});
