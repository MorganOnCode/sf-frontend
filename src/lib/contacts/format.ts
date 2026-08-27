import type { Contact } from "./types";

/** Presentation helpers shared by the list, the detail page, and the cards. */

/** Up to two letters for the avatar bubble. */
export function initials(contact: Pick<Contact, "first_name" | "last_name">) {
  return `${contact.first_name.at(0) ?? ""}${contact.last_name.at(0) ?? ""}`
    .toUpperCase()
    .trim();
}

// Rendered on the server and hydrated on the client, so pin the locale and zone
// rather than letting each side pick its own and mismatch.
const TIMESTAMP_FORMAT = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

export function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return `${TIMESTAMP_FORMAT.format(date)} UTC`;
}

/** "Ada Lovelace · Mathematician at Analytical Engines"-style subtitle. */
export function jobLine(contact: Pick<Contact, "job_title" | "company">): string | null {
  if (contact.job_title && contact.company) {
    return `${contact.job_title} at ${contact.company}`;
  }
  return contact.job_title ?? contact.company ?? null;
}

/** Single-line postal address, skipping the parts that are not filled in. */
export function addressLine(
  contact: Pick<Contact, "address" | "city" | "state" | "postal_code" | "country">,
): string | null {
  const parts = [
    contact.address,
    contact.city,
    [contact.state, contact.postal_code].filter(Boolean).join(" "),
    contact.country,
  ].filter((part): part is string => Boolean(part && part.trim()));

  return parts.length ? parts.join(", ") : null;
}
