import {
  MAX_PHOTO_BYTES,
  decodedByteLength,
  isPhotoDataUrl,
} from "@/lib/contacts/photo";

function dataUrl(bytes: number, mediaType = "image/jpeg"): string {
  return `data:${mediaType};base64,${btoa("x".repeat(bytes))}`;
}

describe("isPhotoDataUrl", () => {
  it.each(["image/jpeg", "image/png", "image/gif", "image/webp"])(
    "accepts %s",
    (mediaType) => {
      expect(isPhotoDataUrl(dataUrl(9, mediaType))).toBe(true);
    },
  );

  it("rejects SVG, which can carry script", () => {
    expect(isPhotoDataUrl(dataUrl(9, "image/svg+xml"))).toBe(false);
  });

  it.each([
    ["a remote URL", "https://example.com/ada.png"],
    ["a non-image data URL", "data:text/html;base64,PGgxPmhpPC9oMT4="],
    ["a data URL that is not base64", "data:image/png,raw"],
    ["characters outside the base64 alphabet", "data:image/png;base64,not base64!"],
  ])("rejects %s", (_label, value) => {
    expect(isPhotoDataUrl(value)).toBe(false);
  });
});

describe("decodedByteLength", () => {
  it.each([1, 2, 3, 100, 1024])("measures %i bytes without decoding", (bytes) => {
    expect(decodedByteLength(dataUrl(bytes))).toBe(bytes);
  });

  it("recognises a photo over the API's ceiling", () => {
    expect(decodedByteLength(dataUrl(MAX_PHOTO_BYTES + 1))).toBeGreaterThan(
      MAX_PHOTO_BYTES,
    );
  });
});
