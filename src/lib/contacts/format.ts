import {
  ADDRESS_TYPE_LABELS,
  type Address,
  type AddressType,
  type Contact,
} from "./types";

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

/**
 * An address as lines, skipping the parts that are not filled in.
 *
 * State and postal code share a line the way they are written on an envelope.
 */
export function addressLines(address: Omit<Address, "id" | "type">): string[] {
  return [
    address.street,
    address.city,
    [address.state, address.postal_code].filter(Boolean).join(" "),
    address.country,
  ].filter((part): part is string => Boolean(part && part.trim()));
}

/** The same address on one line, for somewhere that has no room for four. */
export function addressLine(
  address: Omit<Address, "id" | "type">,
): string | null {
  const lines = addressLines(address);
  return lines.length ? lines.join(", ") : null;
}

/**
 * Addresses split by type, in the order the types are declared, so a contact's
 * home addresses read together and the sections never reshuffle between renders.
 */
export function groupAddressesByType(
  addresses: Address[],
): { type: AddressType; label: string; addresses: Address[] }[] {
  return (Object.keys(ADDRESS_TYPE_LABELS) as AddressType[])
    .map((type) => ({
      type,
      label: ADDRESS_TYPE_LABELS[type],
      addresses: addresses.filter((address) => address.type === type),
    }))
    .filter((group) => group.addresses.length > 0);
}
