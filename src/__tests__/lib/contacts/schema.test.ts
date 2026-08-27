import {
  CONTACT_FIELDS,
  contactInputSchema,
  formDataToAddresses,
  formDataToValues,
  zodAddressErrors,
  zodFieldErrors,
} from "@/lib/contacts/schema";

function values(overrides: Record<string, string> = {}) {
  return {
    first_name: "Ada",
    last_name: "Lovelace",
    email: "Ada@Example.com",
    phone: "",
    company: "",
    job_title: "",
    notes: "",
    ...overrides,
  };
}

describe("contactInputSchema", () => {
  it("lowercases the email and nulls out the blanks", () => {
    const parsed = contactInputSchema.parse(values());

    expect(parsed.email).toBe("ada@example.com");
    expect(parsed.phone).toBeNull();
    expect(parsed.notes).toBeNull();
  });

  it("trims what the user typed", () => {
    expect(contactInputSchema.parse(values({ company: "  Acme  " })).company).toBe(
      "Acme",
    );
  });

  it("requires the three fields the API requires", () => {
    const result = contactInputSchema.safeParse(
      values({ first_name: " ", last_name: "", email: "" }),
    );

    expect(result.success).toBe(false);
    expect(zodFieldErrors(result.error!)).toEqual({
      first_name: "First name is required",
      last_name: "Last name is required",
      email: "Email is required",
    });
  });

  it("rejects a malformed email", () => {
    const result = contactInputSchema.safeParse(values({ email: "not-an-email" }));
    expect(zodFieldErrors(result.error!).email).toBe("Enter a valid email address");
  });

  it("enforces the API's length limits", () => {
    const result = contactInputSchema.safeParse(
      values({ first_name: "a".repeat(101), company: "c".repeat(201) }),
    );

    expect(zodFieldErrors(result.error!)).toEqual({
      first_name: "First name must be 100 characters or fewer",
      company: "Company must be 200 characters or fewer",
    });
  });
});

describe("addresses", () => {
  const address = (overrides: Record<string, string> = {}) => ({
    type: "home",
    street: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
    ...overrides,
  });

  it("accepts a contact with several typed addresses", () => {
    const result = contactInputSchema.safeParse(
      values({
        addresses: [address({ type: "home" }), address({ type: "work" })],
      } as never),
    );

    expect(result.success).toBe(true);
    expect(result.data!.addresses.map((a) => a.type)).toEqual(["home", "work"]);
  });

  it("defaults to no addresses at all", () => {
    expect(contactInputSchema.safeParse(values()).data!.addresses).toEqual([]);
  });

  it("blanks a row's empty parts to null, as the API expects", () => {
    const result = contactInputSchema.safeParse(
      values({ addresses: [address({ city: "London" })] } as never),
    );

    expect(result.data!.addresses[0]).toEqual({
      type: "home",
      street: null,
      city: "London",
      state: null,
      postal_code: null,
      country: null,
    });
  });

  it("rejects a type the API does not know", () => {
    const result = contactInputSchema.safeParse(
      values({ addresses: [address({ type: "office" })] } as never),
    );

    expect(result.success).toBe(false);
    expect(zodAddressErrors(result.error!)[0].type).toMatch(/Home, Work, or Other/);
  });

  it("reports a length problem against the row it happened in", () => {
    const result = contactInputSchema.safeParse(
      values({
        addresses: [address(), address({ postal_code: "9".repeat(21) })],
      } as never),
    );

    expect(zodAddressErrors(result.error!)).toEqual({
      1: { postal_code: "Postal code must be 20 characters or fewer" },
    });
  });

  it("refuses more addresses than the API stores", () => {
    const result = contactInputSchema.safeParse(
      values({ addresses: Array.from({ length: 21 }, () => address()) } as never),
    );

    expect(result.success).toBe(false);
  });
});

describe("formDataToAddresses", () => {
  it("reads the rows back in order", () => {
    const formData = new FormData();
    formData.set("addresses.0.type", "work");
    formData.set("addresses.0.city", "London");
    formData.set("addresses.1.type", "home");
    formData.set("addresses.1.city", "Surrey");

    expect(formDataToAddresses(formData).map((a) => [a.type, a.city])).toEqual([
      ["work", "London"],
      ["home", "Surrey"],
    ]);
  });

  it("re-packs the positions after a row in the middle was removed", () => {
    const formData = new FormData();
    formData.set("addresses.0.city", "First");
    formData.set("addresses.2.city", "Third");

    expect(formDataToAddresses(formData).map((a) => a.city)).toEqual([
      "First",
      "Third",
    ]);
  });

  it("sorts numerically, so row 10 does not land before row 2", () => {
    const formData = new FormData();
    formData.set("addresses.2.city", "Second");
    formData.set("addresses.10.city", "Tenth");

    expect(formDataToAddresses(formData).map((a) => a.city)).toEqual([
      "Second",
      "Tenth",
    ]);
  });

  it("fills in the parts a row did not send", () => {
    const formData = new FormData();
    formData.set("addresses.0.city", "London");

    expect(formDataToAddresses(formData)[0]).toEqual({
      type: "home",
      street: "",
      city: "London",
      state: "",
      postal_code: "",
      country: "",
    });
  });

  it("ignores fields that are not address rows", () => {
    const formData = new FormData();
    formData.set("first_name", "Ada");
    formData.set("addressesfoo", "nope");

    expect(formDataToAddresses(formData)).toEqual([]);
  });
});

describe("formDataToValues", () => {
  it("pulls every known field out, defaulting to an empty string", () => {
    const formData = new FormData();
    formData.set("first_name", "Grace");
    formData.set("email", "grace@example.com");
    formData.set("ignored", "nope");

    const extracted = formDataToValues(formData);

    expect(extracted.first_name).toBe("Grace");
    expect(extracted.last_name).toBe("");
    // The text controls, plus `photo` — a hidden input fed by the file picker.
    expect(Object.keys(extracted).sort()).toEqual(
      [...CONTACT_FIELDS.map((field) => field.name), "photo"].sort(),
    );
  });

  it("picks up the photo the file picker put in its hidden input", () => {
    const formData = new FormData();
    formData.set("photo", "data:image/jpeg;base64,AAAA");

    expect(formDataToValues(formData).photo).toBe("data:image/jpeg;base64,AAAA");
  });
});
