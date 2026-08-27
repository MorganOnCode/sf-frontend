/**
 * Types mirroring the Contacts API OpenAPI 3.1 document (`GET /openapi.json`).
 * Field names stay snake_case so payloads map 1:1 onto the wire format.
 */

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
  address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
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
 * says whether to fetch the image or fall back to initials.
 */
export interface ContactListItem extends Omit<Contact, "photo"> {
  has_photo: boolean;
}

/** Every editable field, i.e. `ContactCreate` / `ContactReplace`. */
export type ContactInput = Omit<
  Contact,
  "id" | "created_at" | "updated_at" | "full_name"
>;

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
export type FormState = {
  status: "idle" | "error";
  /** Message shown above the form; used for API-level failures. */
  message?: string;
  /** Per-field messages keyed by input name. */
  fieldErrors?: Partial<Record<keyof ContactInput, string>>;
  /** Echo of the submitted values so the form survives a failed round trip. */
  values?: Partial<Record<keyof ContactInput, string>>;
};

export const EMPTY_FORM_STATE: FormState = { status: "idle" };
