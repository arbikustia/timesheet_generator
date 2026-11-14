/** @jest-environment node */
import { checkDataFolder, checkRepo, checkTicketPattern, formatChecks } from "./doctor.util";

describe("doctor", () => {
  it("should check a repository and its git email", async () => {
    const answers: Partial<Record<string, string>> = { "rev-parse": "true\n", config: "me@example.com\n" };
    const git = async (_repo: string, args: string[]): Promise<string> => answers[args[0]] ?? Promise.reject(new Error("x"));

    expect(await checkRepo({ path: "/w", label: "W" }, git)).toEqual([
      { ok: true, label: "Repo W", detail: "/w" },
      { ok: true, label: "Email git W", detail: "me@example.com" },
    ]);

    delete answers.config;
    expect((await checkRepo({ path: "/w", label: "" }, git))[1]).toMatchObject({ ok: false, label: "Email git /w" });

    delete answers["rev-parse"];
    expect(await checkRepo({ path: "/w", label: "W" }, git)).toEqual([{ ok: false, label: "Repo W", detail: "/w bukan repo git atau tidak ditemukan." }]);
  });

  it("should check the data folder and the ticket pattern", async () => {
    expect((await checkDataFolder({ home: "/proc/forbidden-timesheet", worklog: "w", config: "c" })).ok).toBe(false);
    expect(checkTicketPattern("(BIT)-\\d+").ok).toBe(true);
    expect(checkTicketPattern("(").ok).toBe(false);
    expect(formatChecks([{ ok: true, label: "A", detail: "x" }, { ok: false, label: "B", detail: "y" }])).toBe("✓ A: x\n✗ B: y");
  });
});
