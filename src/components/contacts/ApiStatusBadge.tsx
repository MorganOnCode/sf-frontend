import type { HealthResponse } from "@/lib/contacts/types";

/**
 * Renders `GET /health` so it is obvious at a glance whether the page is
 * showing live data or a stale/failed read.
 */
export default function ApiStatusBadge({
  health,
}: {
  health: HealthResponse | null;
}) {
  const ok = health?.status === "ok";

  return (
    <span
      className={`tag gap-1.5 ${ok ? "tag-accent" : "tag-outline"}`}
      title={
        ok
          ? `API healthy · ${health?.database} · ${health?.contacts} stored`
          : "The Contacts API did not respond to its health check"
      }
    >
      <span
        aria-hidden="true"
        className="h-1.5 w-1.5 rounded-full bg-current"
      />
      <span className="uppercase tracking-wider">
        {ok ? `API OK · ${health?.contacts}` : "API unreachable"}
      </span>
    </span>
  );
}
