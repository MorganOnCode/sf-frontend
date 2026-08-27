import type { NextRequest } from "next/server";
import { apiFetch } from "@/lib/apiClient";

/**
 * Serve a contact's photo to the browser.
 *
 * List responses do not inline photos, so each avatar is a real image request.
 * The backend's address is server-only, so that request comes here instead of
 * going to the API directly — which also keeps every avatar same-origin.
 *
 * `ETag` and `Cache-Control` are passed through in both directions, so after the
 * first render an unchanged avatar costs a `304` rather than the image again.
 */

/** Headers worth forwarding from the API's response. */
const PASS_THROUGH = ["content-type", "etag", "cache-control"];

/**
 * The whole segment has to be the ID. `Number.parseInt` reads a prefix, so it
 * would happily turn `1abc` into contact 1 and mint an alternate URL for a photo.
 * Capped in length so the ID stays an exact integer.
 */
const CONTACT_ID = /^[1-9]\d{0,14}$/;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!CONTACT_ID.test(id)) {
    return new Response(null, { status: 404 });
  }

  const ifNoneMatch = request.headers.get("if-none-match");

  let upstream: Response;
  try {
    upstream = await apiFetch(`/api/v1/contacts/${id}/photo`, {
      cache: "no-store",
      headers: {
        Accept: "image/*",
        ...(ifNoneMatch ? { "If-None-Match": ifNoneMatch } : {}),
      },
    });
  } catch {
    // The API is unreachable. The avatar is decoration, so fail quietly and let
    // the caller fall back to initials rather than breaking the page.
    return new Response(null, { status: 502 });
  }

  // A contact with no photo is a normal 404, not an error worth dressing up.
  if (!upstream.ok && upstream.status !== 304) {
    return new Response(null, { status: upstream.status === 404 ? 404 : 502 });
  }

  const headers = new Headers();
  for (const name of PASS_THROUGH) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }

  return upstream.status === 304
    ? new Response(null, { status: 304, headers })
    : new Response(upstream.body, { status: 200, headers });
}
