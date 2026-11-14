import { loadOctoberDoc, SAMPLE_IMAGE } from "@/fixture/timesheet.fixture";

import { buildEvidenceBlocks, getPasteTargetDate } from "./EvidencePanel.util";

describe("buildEvidenceBlocks", () => {
  it("should list entry dates and evidence-only dates with their state", () => {
    const doc = loadOctoberDoc();

    doc.evidence["2026-10-03"] = [SAMPLE_IMAGE];

    const blocks = buildEvidenceBlocks(doc, "2026-10-07", ["2026-10-01"]);

    expect(blocks).toHaveLength(23);
    expect(blocks[0]).toMatchObject({ date: "2026-10-01", label: "Kam, 01/10/2026", tasks: "Tech debt case admin list", isProcessing: true });
    expect(blocks[2]).toMatchObject({ date: "2026-10-03", hasEntries: false, images: [SAMPLE_IMAGE], tasks: "" });
    expect(blocks.find((block) => block.date === "2026-10-07")).toMatchObject({ isActive: true, tasks: "Tech debt case admin detail" });
  });
});

describe("getPasteTargetDate", () => {
  it("should prefer the active date, then the first date with a free slot", () => {
    const doc = loadOctoberDoc();

    doc.evidence["2026-10-01"] = [SAMPLE_IMAGE, SAMPLE_IMAGE];

    const blocks = buildEvidenceBlocks(doc, null, []);

    expect(getPasteTargetDate(blocks, "2026-10-05")).toBe("2026-10-05");
    expect(getPasteTargetDate(blocks, "2026-10-04")).toBe("2026-10-02");
    expect(getPasteTargetDate([], null)).toBeNull();
  });
});
