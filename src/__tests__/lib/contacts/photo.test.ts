import {
  MAX_PHOTO_BYTES,
  contactPhotoUrl,
  decodedByteLength,
  isPhotoDataUrl,
  photoSrc,
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

describe("photoSrc", () => {
  it("uses the inline photo a single-contact read returns", () => {
    expect(photoSrc({ id: 1, photo: dataUrl(9), has_photo: true })).toBe(dataUrl(9));
  });

  it("falls back to the photo route for a list row, which has no inline photo", () => {
    expect(photoSrc({ id: 7, has_photo: true })).toBe(contactPhotoUrl(7));
  });

  it("returns null when the contact has no photo", () => {
    expect(photoSrc({ id: 7, has_photo: false })).toBeNull();
    expect(photoSrc({ id: 7, photo: null })).toBeNull();
  });

  it("returns null when a flag says yes but there is no id to fetch by", () => {
    expect(photoSrc({ has_photo: true })).toBeNull();
  });
});

describe("the size ceiling", () => {
  it("leaves the whole data URL inside the server action body limit", () => {
    // Next is configured for 2 MB; base64 inflates the decoded bytes by a third.
    expect(dataUrl(MAX_PHOTO_BYTES).length).toBeLessThan(2 * 1024 * 1024);
  });
});
