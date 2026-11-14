/** @jest-environment node */
import type { GitRunner } from "./cli.type";
import { countCommitsToday, filterTouchedToday, readMtime, takeSnapshot } from "./snapshot.util";

const NOW = new Date(2026, 10, 14, 16, 45);

/**
 * Fake git that answers by subcommand.
 * @param {Partial<Record<string, string>>} answers - Output per first argument (`config` may be missing)
 * @returns {GitRunner} - Runner
 */
const fakeGit = (answers: Partial<Record<string, string>>): GitRunner => {
  return async (_repo: string, args: string[]): Promise<string> => {
    const key = args[0] === "diff" && args.includes("--cached") ? "cached" : args[0];
    const answer = answers[key];

    if (answer === undefined) {
      throw new Error(`no answer for ${key}`);
    }

    return answer;
  };
};

describe("snapshot", () => {
  it("should record paths, counts, today's untracked files and commits", async () => {
    const git = fakeGit({
      status: "# branch.head bit-12-login\n1 .M N... 1 1 1 a b src/a.ts\n? new.ts\n? old.ts\n",
      diff: "3\t1\tsrc/a.ts\n",
      cached: "2\t0\tsrc/a.ts\n",
      config: "me@example.com\n",
      log: "abc\ndef\n",
    });
    const mtimeOf = async (path: string): Promise<number | null> => (path.endsWith("new.ts") ? NOW.getTime() : new Date(2026, 0, 1).getTime());
    const line = await takeSnapshot({ path: "/w/fe", label: "" }, { ticketPattern: "(BIT|ASUM)-\\d+", now: NOW, git, mtimeOf });

    expect(line).toMatchObject({
      kind: "git-snapshot",
      repo: "/w/fe",
      label: "fe",
      branch: "bit-12-login",
      ticket: "BIT-12",
      changed: [
        { path: "src/a.ts", status: "M", add: 5, del: 1 },
        { path: "new.ts", status: "?", add: 0, del: 0 },
      ],
      commitsToday: 2,
    });
    expect(line.ts.startsWith("2026-11-14T16:45:00")).toBe(true);
  });

  it("should not count commits without a git email and handle a detached head", async () => {
    expect(await countCommitsToday("/w", fakeGit({}))).toBe(0);

    const line = await takeSnapshot({ path: "/w/fe", label: "FE" }, { ticketPattern: "(", now: NOW, git: fakeGit({ status: "# branch.head (detached)\n", diff: "", cached: "" }) });

    expect(line).toMatchObject({ label: "FE", branch: null, ticket: null, changed: [], commitsToday: 0 });
  });

  it("should skip files whose time cannot be read", async () => {
    expect(await filterTouchedToday([{ path: "x", status: "?", isUntracked: true }], "/w", NOW, async () => null)).toEqual([]);
    expect(await readMtime("/definitely/missing/file")).toBeNull();
    expect(await readMtime(__filename)).toEqual(expect.any(Number));
  });
});
