import { applyNavigationPlan, getNavigationPlan } from "./TimesheetBuilder.util";

describe("getNavigationPlan", () => {
  it("should map every target kind to a tab and anchor", () => {
    expect(getNavigationPlan({ kind: "entry", entryId: "e1" })).toEqual({ tab: "activities", anchorId: "entry-e1", previewDate: null });
    expect(getNavigationPlan({ kind: "review", entryId: "e1" })).toEqual({ tab: "review", anchorId: "review-e1", previewDate: null });
    expect(getNavigationPlan({ kind: "date", date: "2026-10-01" })).toEqual({ tab: "activities", anchorId: null, previewDate: "2026-10-01" });
    expect(getNavigationPlan({ kind: "evidence", date: "2026-10-01" })).toEqual({ tab: "evidence", anchorId: "evidence-2026-10-01", previewDate: "2026-10-01" });
    expect(getNavigationPlan({ kind: "profile", field: "squad" as "leadProject" })).toMatchObject({ tab: "settings", anchorId: "profile-squad" });
    expect(getNavigationPlan({ kind: "signature", key: "preparedBy" })).toMatchObject({ tab: "settings", anchorId: "signature-preparedBy" });
  });
});

describe("applyNavigationPlan", () => {
  it("should scroll the preview row and focus the anchor", () => {
    document.body.innerHTML = '<section data-preview><table><tbody><tr data-date="2026-10-01"></tr></tbody></table></section><li id="evidence-2026-10-01" tabindex="0"></li>';

    const scroll = jest.spyOn(Element.prototype, "scrollIntoView");

    scroll.mockClear();
    applyNavigationPlan({ tab: "evidence", anchorId: "evidence-2026-10-01", previewDate: "2026-10-01" });

    expect(scroll).toHaveBeenCalledTimes(2);
    expect(document.activeElement).toHaveAttribute("id", "evidence-2026-10-01");

    applyNavigationPlan({ tab: "activities", anchorId: "missing", previewDate: null });
    expect(scroll).toHaveBeenCalledTimes(2);
    document.body.innerHTML = "";
  });
});
