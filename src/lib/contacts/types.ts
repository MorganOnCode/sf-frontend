/**
 * Types mirroring the Contacts API OpenAPI 3.1 document (`GET /openapi.json`).
 * Field names stay snake_case so payloads map 1:1 onto the wire format.
 */

/** What an address is for. Mirrors the API's `AddressType`. */
export const ADDRESS_TYPES = ["home", "work", "other"] as const;
export type AddressType = (typeof ADDRESS_TYPES)[number];

/** Human labels for the type picker and the detail page's groups. */
export const ADDRESS_TYPE_LABELS: Record<AddressType, string> = {
  home: "Home",
  work: "Work",
  other: "Other",
};

/** The API caps how many addresses one contact may carry. */
export const MAX_ADDRESSES = 20;

/** `AddressRead` — one stored address belonging to a contact. */
export interface Address {
  id: number;
  type: AddressType;
  street: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
}

/** `AddressCreate` — one address as sent when saving a contact. */
export type AddressInput = Omit<Address, "id">;

/** `ContactRead` — a stored contact, as returned by every contact endpoint. */
export interface Contact {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  company: string | null;
  job_title: string | null;
  /** Base64 `data:` URL, or `null` when the contact has no photo. */
  photo: string | null;
  /** Every address for this contact, oldest first. A contact may have none. */
  addresses: Address[];
  notes: string | null;
  created_at: string;
  updated_at: string;
  full_name: string;
}

/**
 * `ContactListItem` — a contact as a list page returns it.
 *
 * The API leaves `photo` out of list responses: a page holds up to 200 contacts,
 * and an inline photo on every row would run to hundreds of megabytes. `has_photo`
 * says whether to fetch the image or fall back to initials. Addresses are left
 * out for the same reason — the table does not show them.
 */
export interface ContactListItem
  extends Omit<Contact, "photo" | "addresses"> {
  has_photo: boolean;
}

/**
 * Every editable field, i.e. `ContactCreate` / `ContactReplace`.
 *
 * Addresses are sent without ids: saving replaces the stored set rather than
 * matching rows up and editing them, which is what the API's `PUT` does.
 */
export type ContactInput = Omit<
  Contact,
  "id" | "created_at" | "updated_at" | "full_name" | "addresses"
> & {
  addresses: AddressInput[];
};

/** `ContactPage` — one page of contacts plus the totals needed to paginate. */
export interface ContactPage {
  items: ContactListItem[];
  total: number;
  limit: number;
  offset: number;
}

/** `HealthResponse` — result of the liveness probe. */
export interface HealthResponse {
  status: string;
  database: string;
  contacts: number;
}

/** Sort fields the API's allow-list accepts. */
export const SORT_FIELDS = [
  "id",
  "first_name",
  "last_name",
  "email",
  "company",
  "created_at",
  "updated_at",
] as const;

export type SortField = (typeof SORT_FIELDS)[number];
export type SortOrder = "asc" | "desc";

/** Bounds the API enforces on `limit`. */
export const MIN_LIMIT = 1;
export const MAX_LIMIT = 200;
export const DEFAULT_PER_PAGE = 25;
export const PER_PAGE_OPTIONS = [10, 25, 50, 100] as const;

/**
 * Result of a server action, consumed by `useActionState` in the forms.
 * Lives here (not in the `"use server"` module) so client components can import
 * the type without pulling server code into the browser bundle.
 */
/** Every contact field that is a plain text control — i.e. not the address list. */
export type ContactTextField = Exclude<keyof ContactInput, "addresses">;

/** One address row as it comes back out of the form, before validation. */
export type AddressFormValues = Record<keyof AddressInput, string>;

export type FormState = {
  status: "idle" | "error";
  /** Message shown above the form; used for API-level failures. */
  message?: string;
  /** Per-field messages keyed by input name. */
  fieldErrors?: Partial<Record<ContactTextField, string>>;
  /** Per-address messages, keyed by the row's position in the form. */
  addressErrors?: Record<number, Partial<Record<keyof AddressInput, string>>>;
  /** Echo of the submitted values so the form survives a failed round trip. */
  values?: Partial<Record<ContactTextField, string>>;
  /** Echo of the submitted address rows, so they survive too. */
  addresses?: AddressFormValues[];
};

export const EMPTY_FORM_STATE: FormState = { status: "idle" };
