import { z } from "zod";
import {
  MAX_PHOTO_BYTES,
  MAX_PHOTO_LABEL,
  decodedByteLength,
  isPhotoDataUrl,
} from "./photo";
import {
  ADDRESS_TYPES,
  MAX_ADDRESSES,
  type AddressFormValues,
  type AddressInput,
  type ContactInput,
  type ContactTextField,
} from "./types";

/**
 * Client/server-shared validation for the contact form.
 *
 * The rules mirror the API's Pydantic models (`ContactCreate` / `ContactReplace`)
 * so the user sees a mistake before a round trip — the API stays the authority,
 * and anything it rejects anyway is surfaced by `toFieldErrors` in `./api.ts`.
 */

/** Optional text: trimmed, and blank becomes `null` (the API clears the field). */
function optionalText(max: number, label: string) {
  return z
    .string()
    .trim()
    .max(max, `${label} must be ${max} characters or fewer`)
    .transform((value) => value || null)
    .nullable()
    .default(null);
}

function requiredText(max: number, label: string) {
  return z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} must be ${max} characters or fewer`);
}

/**
 * One address row. `type` is the only required part — an otherwise blank row is
 * still a valid address, and the user can fill it in later.
 */
export const addressInputSchema = z.object({
  type: z.enum(ADDRESS_TYPES, "Choose Home, Work, or Other"),
  street: optionalText(300, "Street"),
  city: optionalText(120, "City"),
  state: optionalText(120, "State"),
  postal_code: optionalText(20, "Postal code"),
  country: optionalText(120, "Country"),
}) satisfies z.ZodType<AddressInput, unknown>;

export type AddressFieldName = keyof AddressInput;

/** The address controls, in the order the editor lays them out. */
export const ADDRESS_FIELDS: {
  name: Exclude<AddressFieldName, "type">;
  label: string;
  maxLength: number;
  placeholder: string;
  autoComplete: string;
}[] = [
  {
    name: "street",
    label: "Street",
    maxLength: 300,
    placeholder: "1 Market St, Suite 400",
    autoComplete: "street-address",
  },
  {
    name: "city",
    label: "City",
    maxLength: 120,
    placeholder: "San Francisco",
    autoComplete: "address-level2",
  },
  {
    name: "state",
    label: "State / region",
    maxLength: 120,
    placeholder: "CA",
    autoComplete: "address-level1",
  },
  {
    name: "postal_code",
    label: "Postal code",
    maxLength: 20,
    placeholder: "94105",
    autoComplete: "postal-code",
  },
  {
    name: "country",
    label: "Country",
    maxLength: 120,
    placeholder: "USA",
    autoComplete: "country-name",
  },
];

export const contactInputSchema = z.object({
  first_name: requiredText(100, "First name"),
  last_name: requiredText(100, "Last name"),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .max(320, "Email must be 320 characters or fewer")
    .pipe(z.email("Enter a valid email address"))
    .transform((value) => value.toLowerCase()),
  phone: optionalText(40, "Phone"),
  company: optionalText(200, "Company"),
  job_title: optionalText(200, "Job title"),
  photo: z
    .string()
    .trim()
    .transform((value) => value || null)
    .nullable()
    .default(null)
    .refine(
      (value) => value === null || isPhotoDataUrl(value),
      "Photo must be a JPEG, PNG, GIF, or WebP image",
    )
    .refine(
      (value) => value === null || decodedByteLength(value) <= MAX_PHOTO_BYTES,
      `Photo must be ${MAX_PHOTO_LABEL} or smaller`,
    ),
  addresses: z
    .array(addressInputSchema)
    .max(MAX_ADDRESSES, `A contact can have at most ${MAX_ADDRESSES} addresses`)
    .default([]),
  notes: z
    .string()
    .trim()
    .transform((value) => value || null)
    .nullable()
    .default(null),
}) satisfies z.ZodType<ContactInput, unknown>;

export type ContactFormValues = z.input<typeof contactInputSchema>;

/** Collapse a ZodError into one message per field, keyed by input name. */
export function zodFieldErrors(
  error: z.ZodError,
): Partial<Record<ContactTextField, string>> {
  const fieldErrors: Partial<Record<ContactTextField, string>> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    // Address problems are keyed by row, not by field — see `zodAddressErrors`.
    if (typeof key === "string" && key !== "addresses" && !(key in fieldErrors)) {
      fieldErrors[key as ContactTextField] = issue.message;
    }
  }
  return fieldErrors;
}

/**
 * Collapse the address half of a ZodError into one message per field, per row.
 * Issue paths look like `["addresses", 1, "postal_code"]`.
 */
export function zodAddressErrors(
  error: z.ZodError,
): Record<number, Partial<Record<AddressFieldName, string>>> {
  const rows: Record<number, Partial<Record<AddressFieldName, string>>> = {};

  for (const issue of error.issues) {
    const [root, index, field] = issue.path;
    if (root !== "addresses" || typeof index !== "number") continue;

    const row = (rows[index] ??= {});
    const name = typeof field === "string" ? (field as AddressFieldName) : "street";
    row[name] ??= issue.message;
  }

  return rows;
}

/* ------------------------------------------------------------------ */
/* Form metadata — one source of truth for the fields and their limits */
/* ------------------------------------------------------------------ */

export interface ContactFieldSpec {
  name: ContactTextField;
  label: string;
  type?: "text" | "email" | "tel" | "textarea";
  required?: boolean;
  maxLength: number;
  placeholder?: string;
  autoComplete?: string;
  /** Column span inside the section grid. */
  wide?: boolean;
}

export interface ContactFieldGroup {
  title: string;
  description: string;
  fields: ContactFieldSpec[];
}

export const CONTACT_FIELD_GROUPS: ContactFieldGroup[] = [
  {
    title: "Identity",
    description: "First name, last name, and email are required.",
    fields: [
      {
        name: "first_name",
        label: "First name",
        required: true,
        maxLength: 100,
        placeholder: "Ada",
        autoComplete: "given-name",
      },
      {
        name: "last_name",
        label: "Last name",
        required: true,
        maxLength: 100,
        placeholder: "Lovelace",
        autoComplete: "family-name",
      },
      {
        name: "email",
        label: "Email",
        type: "email",
        required: true,
        maxLength: 320,
        placeholder: "ada@example.com",
        autoComplete: "email",
      },
      {
        name: "phone",
        label: "Phone",
        type: "tel",
        maxLength: 40,
        placeholder: "+1-415-555-0101",
        autoComplete: "tel",
      },
    ],
  },
  {
    title: "Work",
    description: "Where they work and what they do.",
    fields: [
      {
        name: "company",
        label: "Company",
        maxLength: 200,
        placeholder: "Analytical Engines",
        autoComplete: "organization",
      },
      {
        name: "job_title",
        label: "Job title",
        maxLength: 200,
        placeholder: "Mathematician",
        autoComplete: "organization-title",
      },
    ],
  },
  {
    title: "Notes",
    description: "Anything worth remembering. No length limit.",
    fields: [
      {
        name: "notes",
        label: "Notes",
        type: "textarea",
        maxLength: 10_000,
        placeholder: "Met at the SF hackathon.",
        wide: true,
      },
    ],
  },
];

export const CONTACT_FIELDS: ContactFieldSpec[] = CONTACT_FIELD_GROUPS.flatMap(
  (group) => group.fields,
);

/**
 * Pull the contact fields out of a submitted form, as raw strings.
 *
 * `photo` is read separately: it is a hidden input fed by the file picker, not
 * one of the text controls described by `CONTACT_FIELDS`.
 */
export function formDataToValues(
  formData: FormData,
): Record<ContactTextField, string> {
  return {
    ...Object.fromEntries(
      CONTACT_FIELDS.map((field) => [
        field.name,
        String(formData.get(field.name) ?? ""),
      ]),
    ),
    photo: String(formData.get("photo") ?? ""),
  } as Record<ContactTextField, string>;
}

/** `addresses.2.city` → row 2, field `city`. */
const ADDRESS_KEY = /^addresses\.(\d+)\.([a-z_]+)$/;

/**
 * Pull the address rows out of a submitted form.
 *
 * The editor names its inputs by position, so the rows survive a submit without
 * JavaScript. Positions are re-packed on the way out: removing the middle row
 * leaves a gap in the indices, and what matters is the order, not the numbers.
 */
export function formDataToAddresses(formData: FormData): AddressFormValues[] {
  const rows = new Map<number, Partial<AddressFormValues>>();

  for (const [key, value] of formData.entries()) {
    const match = ADDRESS_KEY.exec(key);
    if (!match) continue;

    const index = Number(match[1]);
    const field = match[2] as keyof AddressInput;
    const row = rows.get(index) ?? {};
    row[field] = String(value);
    rows.set(index, row);
  }

  return [...rows.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, row]) => ({
      type: row.type ?? "home",
      street: row.street ?? "",
      city: row.city ?? "",
      state: row.state ?? "",
      postal_code: row.postal_code ?? "",
      country: row.country ?? "",
    }));
}
