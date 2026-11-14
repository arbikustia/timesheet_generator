import { getLearnedTicketName, isGeneratedTaskName, mergeEntryRefs, normalizeTicket } from "@/libs/utils/review.util";

import type { Entry } from "@/types/timesheet.type";

const ENTRY: Entry = {
  id: "a",
  date: "2026-11-02",
  task: "Fixing flow case transfer",
  start: "08:00",
  end: "17:00",
  remarkOverride: null,
  source: "git",
  reviewed: false,
  refs: { ticket: "BIT-231", needsName: true },
};

describe("review util", () => {
  it("should normalize tickets and recognise generated names", () => {
    expect(normalizeTicket(" bit-12 ")).toBe("BIT-12");
    expect(isGeneratedTaskName("BIT-12 – case transfer", "BIT-12")).toBe(true);
    expect(isGeneratedTaskName("bit-12", "BIT-12")).toBe(true);
    expect(isGeneratedTaskName("Case transfer", "BIT-12")).toBe(false);
  });

  it("should learn a ticket name only from a renamed entry that needed one", () => {
    expect(getLearnedTicketName(ENTRY)).toEqual({ ticket: "BIT-231", name: "Fixing flow case transfer" });
    expect(getLearnedTicketName({ ...ENTRY, task: "BIT-231 – case transfer" })).toBeNull();
    expect(getLearnedTicketName({ ...ENTRY, refs: { ticket: "BIT-231" } })).toBeNull();
    expect(getLearnedTicketName({ ...ENTRY, refs: undefined })).toBeNull();
    expect(getLearnedTicketName({ ...ENTRY, task: " " })).toBeNull();
  });

  it("should combine touched files when merging", () => {
    expect(mergeEntryRefs({ files: ["a.ts"] }, { files: ["a.ts", "b.ts"] })).toEqual({ files: ["a.ts", "b.ts"] });
    expect(mergeEntryRefs(undefined, { files: ["b.ts"] })).toEqual({ files: ["b.ts"] });
    expect(mergeEntryRefs({ ticket: "X" }, {})).toEqual({ ticket: "X" });
  });
});
