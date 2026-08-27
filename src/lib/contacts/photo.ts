/**
 * Contact photos.
 *
 * The API has no file storage, so a photo is carried as a base64 `data:` URL on
 * the contact itself (see the backend's `app/photo.py`). The limits here mirror
 * the ones that API enforces, so a bad image is caught before a round trip —
 * the API stays the authority.
 */

/** Media types the API accepts. SVG is excluded: it can carry script. */
export const ACCEPTED_PHOTO_TYPES: readonly string[] = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

/** Largest decoded image the API stores. */
export const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

/** Longest edge a photo is resized to before it is uploaded. */
export const PHOTO_MAX_EDGE = 512;

/** Quality passed to the JPEG encoder — visually clean, roughly 40 KB at 512 px. */
const PHOTO_QUALITY = 0.82;

const PHOTO_DATA_URL = /^data:image\/(?:jpeg|png|gif|webp);base64,[A-Za-z0-9+/]*={0,2}$/;

export function isPhotoDataUrl(value: string): boolean {
  return PHOTO_DATA_URL.test(value);
}

/** How many bytes a base64 `data:` URL encodes, without decoding it. */
export function decodedByteLength(dataUrl: string): number {
  const data = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const padding = data.endsWith("==") ? 2 : data.endsWith("=") ? 1 : 0;
  return Math.floor((data.length * 3) / 4) - padding;
}

/**
 * Browser only. Read `file`, shrink it so its longest edge is at most `maxEdge`,
 * and return it as a JPEG `data:` URL.
 *
 * Photos ride along in every list response, so uploading a phone snap untouched
 * would bloat every page of the table. Re-encoding at 512 px keeps a photo in
 * the tens of kilobytes and well inside the API's 2 MB ceiling.
 *
 * The canvas is filled white first: JPEG has no alpha channel, so a transparent
 * PNG would otherwise composite onto black.
 */
export async function downscaleToDataUrl(
  file: File,
  maxEdge: number = PHOTO_MAX_EDGE,
): Promise<string> {
  const bitmap = await createImageBitmap(file);

  try {
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("This browser did not provide a 2D canvas context.");
    }
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(bitmap, 0, 0, width, height);

    return canvas.toDataURL("image/jpeg", PHOTO_QUALITY);
  } finally {
    bitmap.close();
  }
}
