/** @jest-environment node */
import { buildBackfillLines, collectBranchDays, isCommitSubject, parseReflog, readCommitFiles } from "./backfill.util";
import type { GitRunner } from "./cli.type";

const REFLOG = [
  "s6\tHEAD@{2026-11-04T10:00:00+07:00}\tpull: Fast-forward",
  "s5\tHEAD@{2026-11-03T15:00:00+07:00}\tcommit: fix login",
  "s4\tHEAD@{2026-11-03T09:00:00+07:00}\tcheckout: moving from development to feature/BIT-9-login",
  "s3\tHEAD@{2026-11-02T16:00:00+07:00}\tcommit (amend): case transfer",
  "s2\tHEAD@{2026-11-02T11:00:00+07:00}\tcommit: case transfer",
  "s1\tHEAD@{2026-11-02T08:30:00+07:00}\tcheckout: moving from feature/BIT-231-case-transfer to development",
  "s0\tHEAD@{2026-11-02T08:20:00+07:00}\tcheckout: moving from development to feature/BIT-231-case-transfer",
  "broken line",
].join("\n");

describe("reflog backfill", () => {
  it("should parse the reflog oldest first and recognise commits", () => {
    const entries = parseReflog(REFLOG);

    expect(entries[0]).toEqual({ sha: "s0", ts: "2026-11-02T08:20:00+07:00", subject: "checkout: moving from development to feature/BIT-231-case-transfer" });
    expect(entries).toHaveLength(7);
    expect(isCommitSubject("commit (initial): x")).toBe(true);
    expect(isCommitSubject("cherry-pick: x")).toBe(true);
    expect(isCommitSubject("pull: x")).toBe(false);
  });

  it("should collect activity per day and branch", () => {
    expect(collectBranchDays(parseReflog(REFLOG), "main")).toEqual([
      { date: "2026-11-02", branch: "feature/BIT-231-case-transfer", lastTs: "2026-11-02T08:20:00+07:00", commits: [] },
      { date: "2026-11-02", branch: "development", lastTs: "2026-11-02T16:00:00+07:00", commits: ["s2", "s3"] },
      { date: "2026-11-03", branch: "feature/BIT-9-login", lastTs: "2026-11-03T15:00:00+07:00", commits: ["s5"] },
    ]);
    expect(collectBranchDays([{ sha: "a", ts: "2026-11-05T09:00:00+07:00", subject: "commit: x" }], "main")).toEqual([
      { date: "2026-11-05", branch: "main", lastTs: "2026-11-05T09:00:00+07:00", commits: ["a"] },
    ]);
    expect(collectBranchDays([{ sha: "a", ts: "2026-11-05T09:00:00+07:00", subject: "commit: x" }], null)).toEqual([]);
  });

  it("should build lines for uncovered days only, with committed files", async () => {
    const git: GitRunner = async (_repo, args) => {
      if (args[0] === "branch") {
        return "main\n";
      }

      return args[1] === "-g" ? REFLOG : `2\t1\tsrc/${args.at(-1)}.ts\n1\t0\tsrc/shared.ts\n`;
    };
    const lines = await buildBackfillLines({ path: "/w/fe", label: "FE" }, { from: "2026-11-02", to: "2026-11-03" }, new Set(["2026-11-03"]), {
      git,
      ticketPattern: "(BIT|ASUM)-\\d+",
      label: "FE",
    });

    expect(lines).toEqual([
      expect.objectContaining({ ts: "2026-11-02T08:20:00+07:00", branch: "feature/BIT-231-case-transfer", ticket: "BIT-231", changed: [], commitsToday: 0, event: "backfill" }),
      expect.objectContaining({
        branch: "development",
        ticket: null,
        commitsToday: 2,
        changed: [
          { path: "src/s2.ts", status: "C", add: 2, del: 1 },
          { path: "src/shared.ts", status: "C", add: 2, del: 0 },
          { path: "src/s3.ts", status: "C", add: 2, del: 1 },
        ],
      }),
    ]);
  });

  it("should skip ticketless days without commits and survive a repo without reflog", async () => {
    const noTicket: GitRunner = async (_repo, args) => (args[1] === "-g" ? "a\tHEAD@{2026-11-02T08:00:00+07:00}\tcheckout: moving from x to develop" : "");
    const failing: GitRunner = async () => Promise.reject(new Error("no commits"));
    const context = { ticketPattern: "(BIT|ASUM)-\\d+", label: "FE" };

    expect(await buildBackfillLines({ path: "/w", label: "" }, { from: "2026-11-01", to: "2026-11-30" }, new Set(), { ...context, git: noTicket })).toEqual([]);
    expect(await buildBackfillLines({ path: "/w", label: "" }, { from: "2026-11-01", to: "2026-11-30" }, new Set(), { ...context, git: failing })).toEqual([]);
    expect(await readCommitFiles("/w", [], failing)).toEqual([]);
  });
});
