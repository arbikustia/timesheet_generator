/** @jest-environment node */
import { runCommand } from "./command.util";

describe("runCommand", () => {
  it("should pass stdin and capture output and exit code", async () => {
    const script = "process.stdin.on('data', (d) => { process.stdout.write(String(d).toUpperCase()); process.stderr.write('e'); process.exitCode = 3; });";

    expect(await runCommand(process.execPath, ["-e", script], "hi")).toEqual({ code: 3, stdout: "HI", stderr: "e" });
    expect(await runCommand(process.execPath, ["-e", "process.stdout.write('ok')"])).toEqual({ code: 0, stdout: "ok", stderr: "" });
  });

  it("should report a missing program as exit 127", async () => {
    expect((await runCommand("definitely-not-a-program-xyz", [])).code).toBe(127);
  });
});
