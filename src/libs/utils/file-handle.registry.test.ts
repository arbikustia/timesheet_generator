import { getCurrentFileHandle, setCurrentFileHandle } from "@/libs/utils/file-handle.registry";

describe("file handle registry", () => {
  it("should keep the current handle", () => {
    const handle = { name: "doc.json" } as FileSystemFileHandle;

    expect(getCurrentFileHandle()).toBeNull();
    setCurrentFileHandle(handle);
    expect(getCurrentFileHandle()).toBe(handle);
    setCurrentFileHandle(null);
    expect(getCurrentFileHandle()).toBeNull();
  });
});
