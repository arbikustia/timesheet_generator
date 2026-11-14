import { isAcceptedImage, readFileAsDataUrl } from "@/libs/utils/file.util";

describe("readFileAsDataUrl", () => {
  it("should read a blob as a data URL", async () => {
    const blob = new Blob(["hi"], { type: "image/png" });

    await expect(readFileAsDataUrl(blob)).resolves.toBe("data:image/png;base64,aGk=");
  });

  it("should reject when the reader fails", async () => {
    const original = FileReader.prototype.readAsDataURL;

    FileReader.prototype.readAsDataURL = function fail(this: FileReader): void {
      this.dispatchEvent(new ProgressEvent("error"));
    };

    await expect(readFileAsDataUrl(new Blob(["x"]))).rejects.toThrow("Gagal membaca file.");
    FileReader.prototype.readAsDataURL = original;
  });
});

describe("isAcceptedImage", () => {
  it("should accept png, jpeg and webp only", () => {
    expect(isAcceptedImage(new Blob([], { type: "image/png" }))).toBe(true);
    expect(isAcceptedImage(new Blob([], { type: "image/webp" }))).toBe(true);
    expect(isAcceptedImage(new Blob([], { type: "image/gif" }))).toBe(false);
  });
});
