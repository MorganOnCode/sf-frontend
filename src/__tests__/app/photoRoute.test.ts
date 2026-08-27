import { http, HttpResponse } from "msw";
import type { NextRequest } from "next/server";
import { server } from "../mocks/server";
import { api } from "../mocks/handlers";
import { GET } from "@/app/api/contacts/[id]/photo/route";

/**
 * The proxy in front of the API's photo endpoint. It exists so the backend's
 * address stays server-only, which means it is also the thing deciding which
 * URLs resolve to a photo at all.
 */

const ETAG = '"abc123"';

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

/** Stand in for the API, recording which contact ids it was actually asked for. */
function upstream(): string[] {
  const asked: string[] = [];

  server.use(
    http.get(api("/api/v1/contacts/:id/photo"), ({ params, request }) => {
      asked.push(String(params.id));

      if (request.headers.get("if-none-match") === ETAG) {
        return new HttpResponse(null, { status: 304, headers: { etag: ETAG } });
      }
      return new HttpResponse("jpeg-bytes", {
        status: 200,
        headers: {
          "content-type": "image/jpeg",
          etag: ETAG,
          "cache-control": "private, max-age=0, must-revalidate",
        },
      });
    }),
  );

  return asked;
}

function get(id: string, headers: Record<string, string> = {}) {
  const request = new Request(`http://localhost/api/contacts/${id}/photo/`, {
    headers,
  }) as unknown as NextRequest;

  return GET(request, { params: Promise.resolve({ id }) });
}

describe("GET /api/contacts/[id]/photo", () => {
  it("serves the photo and forwards the caching headers", async () => {
    upstream();

    const response = await get("7");

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/jpeg");
    expect(response.headers.get("etag")).toBe(ETAG);
    expect(response.headers.get("cache-control")).toBe(
      "private, max-age=0, must-revalidate",
    );
    await expect(response.text()).resolves.toBe("jpeg-bytes");
  });

  it("answers 304 when the browser already has the current photo", async () => {
    upstream();

    const response = await get("7", { "if-none-match": ETAG });

    expect(response.status).toBe(304);
    expect(response.headers.get("etag")).toBe(ETAG);
  });

  it("rejects an id that is not the whole segment", async () => {
    const asked = upstream();

    // `Number.parseInt("7abc", 10)` is 7, which would make this a second URL
    // for contact 7's photo rather than a miss.
    const response = await get("7abc");

    expect(response.status).toBe(404);
    expect(asked).toEqual([]);
  });

  it.each(["0", "-1", "1.5", "", "abc"])(
    "rejects %p without asking the API",
    async (id) => {
      const asked = upstream();

      expect((await get(id)).status).toBe(404);
      expect(asked).toEqual([]);
    },
  );

  it("passes a missing photo through as a plain 404", async () => {
    server.use(
      http.get(api("/api/v1/contacts/:id/photo"), () =>
        HttpResponse.json({ detail: "Not found" }, { status: 404 }),
      ),
    );

    expect((await get("7")).status).toBe(404);
  });

  it("reports the API being unreachable as a 502, not a crash", async () => {
    server.use(
      http.get(api("/api/v1/contacts/:id/photo"), () => HttpResponse.error()),
    );

    expect((await get("7")).status).toBe(502);
  });
});
