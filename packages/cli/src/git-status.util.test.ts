/** @jest-environment node */
import { parseNumstat, parsePorcelainV2, parseStatusRecord, resolveRenamePath, sumLineCounts } from "./git-status.util";

const STATUS = [
  "# branch.oid 0123",
  "# branch.head BIT-231-case-transfer",
  "1 .M N... 100644 100644 100644 aaa bbb src/pages/Case Transfer.tsx",
  "1 A. N... 000000 100644 100644 000 ccc src/new.ts",
  "2 R. N... 100644 100644 100644 ddd eee R100 src/renamed.ts\tsrc/old.ts",
  "u UU N... 100644 100644 100644 100644 f1 f2 f3 src/conflict.ts",
  "? notes/todo.md",
  "! dist/ignored.js",
  "",
].join("\n");

describe("git status parser", () => {
  it("should read the branch and every changed path (paths only)", () => {
    expect(parsePorcelainV2(STATUS)).toEqual({
      branch: "BIT-231-case-transfer",
      entries: [
        { path: "src/pages/Case Transfer.tsx", status: "M", isUntracked: false },
        { path: "src/new.ts", status: "A", isUntracked: false },
        { path: "src/renamed.ts", status: "R", isUntracked: false },
        { path: "src/conflict.ts", status: "U", isUntracked: false },
        { path: "notes/todo.md", status: "?", isUntracked: true },
      ],
    });
  });

  it("should treat a detached head and short records safely", () => {
    expect(parsePorcelainV2("# branch.head (detached)\n").branch).toBeNull();
    expect(parsePorcelainV2("").branch).toBeNull();
    expect(parseStatusRecord("1 .M N...")).toBeNull();
  });

  it("should parse numstat with binaries and renames and sum staged + unstaged", () => {
    const unstaged = parseNumstat("10\t2\tsrc/a.ts\n-\t-\timg.png\n3\t1\tsrc/{old => new}/b.ts\n1\t0\tx.ts => y.ts\n");
    const staged = parseNumstat("5\t0\tsrc/a.ts\n");

    expect(unstaged.get("img.png")).toEqual({ add: 0, del: 0 });
    expect(unstaged.get("src/new/b.ts")).toEqual({ add: 3, del: 1 });
    expect(unstaged.get("y.ts")).toEqual({ add: 1, del: 0 });
    expect(sumLineCounts([unstaged, staged]).get("src/a.ts")).toEqual({ add: 15, del: 2 });
    expect(resolveRenamePath("{a => }/b.ts")).toBe("/b.ts");
    expect(resolveRenamePath("plain.ts")).toBe("plain.ts");
  });
});
