/** @jest-environment node */
import { assertReadOnlyGit, runGit } from "./git.util";

describe("read-only git", () => {
  it("should allow read commands only", () => {
    expect(() => assertReadOnlyGit(["status", "--porcelain=v2"])).not.toThrow();
    expect(() => assertReadOnlyGit(["config", "--get", "user.email"])).not.toThrow();
    ["add", "commit", "stash", "checkout", "push", "reset"].forEach((command) =>
      expect(() => assertReadOnlyGit([command])).toThrow("Perintah git tidak diizinkan"),
    );
    expect(() => assertReadOnlyGit(["config", "user.email", "x@y.z"])).toThrow("Perintah git tidak diizinkan");
  });

  it("should refuse a write before spawning git", async () => {
    await expect(runGit("/", ["commit", "-m", "x"])).rejects.toThrow("Perintah git tidak diizinkan");
  });
});
