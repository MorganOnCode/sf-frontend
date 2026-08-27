import {
  addressLine,
  addressLines,
  groupAddressesByType,
  formatTimestamp,
  initials,
  jobLine,
} from "@/lib/contacts/format";
import { makeContact } from "../../mocks/handlers";

describe("initials", () => {
  it("takes the first letter of each name", () => {
    expect(initials({ first_name: "ada", last_name: "lovelace" })).toBe("AL");
  });
});

describe("formatTimestamp", () => {
  it("renders UTC regardless of the machine's zone", () => {
    expect(formatTimestamp("2026-08-19T17:04:53.743932Z")).toBe(
      "19 Aug 2026, 17:04 UTC",
    );
  });

  it("degrades to a dash on garbage input", () => {
    expect(formatTimestamp("not a date")).toBe("—");
  });
});

describe("jobLine", () => {
  it("joins the title and the company", () => {
    expect(jobLine(makeContact())).toBe("Mathematician at Analytical Engines");
  });

  it("falls back to whichever one is set", () => {
    expect(jobLine(makeContact({ company: null }))).toBe("Mathematician");
    expect(jobLine(makeContact({ job_title: null }))).toBe("Analytical Engines");
    expect(jobLine(makeContact({ job_title: null, company: null }))).toBeNull();
  });
});

const SF = {
  street: null,
  city: "San Francisco",
  state: "CA",
  postal_code: null,
  country: "USA",
};

describe("addressLine", () => {
  it("skips the parts that are not filled in", () => {
    expect(addressLine(SF)).toBe("San Francisco, CA, USA");
  });

  it("pairs the state with the postal code", () => {
    expect(
      addressLine({ ...SF, street: "1 Market St", postal_code: "94105" }),
    ).toBe("1 Market St, San Francisco, CA 94105, USA");
  });

  it("returns null when there is no address at all", () => {
    expect(
      addressLine({ street: null, city: null, state: null, postal_code: null, country: null }),
    ).toBeNull();
  });
});

describe("addressLines", () => {
  it("puts the state and postal code on one line, as on an envelope", () => {
    expect(
      addressLines({ ...SF, street: "1 Market St", postal_code: "94105" }),
    ).toEqual(["1 Market St", "San Francisco", "CA 94105", "USA"]);
  });
});

describe("groupAddressesByType", () => {
  const address = (id: number, type: "home" | "work" | "other") => ({
    id,
    type,
    ...SF,
  });

  it("groups in a fixed order, whatever order they arrived in", () => {
    const groups = groupAddressesByType([
      address(1, "other"),
      address(2, "work"),
      address(3, "home"),
    ]);

    expect(groups.map((group) => group.type)).toEqual(["home", "work", "other"]);
  });

  it("keeps several of one type together", () => {
    const groups = groupAddressesByType([
      address(1, "home"),
      address(2, "work"),
      address(3, "home"),
    ]);

    expect(groups[0].addresses.map((a) => a.id)).toEqual([1, 3]);
    expect(groups[0].label).toBe("Home");
  });

  it("leaves out the types a contact has none of", () => {
    expect(groupAddressesByType([address(1, "work")])).toHaveLength(1);
  });

  it("returns nothing for a contact with no addresses", () => {
    expect(groupAddressesByType([])).toEqual([]);
  });
});
