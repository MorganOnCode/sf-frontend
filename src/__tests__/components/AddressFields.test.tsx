import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AddressFields from "@/components/contacts/AddressFields";
import type { AddressFormValues } from "@/lib/contacts/types";

function row(overrides: Partial<AddressFormValues> = {}): AddressFormValues {
  return {
    type: "home",
    street: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
    ...overrides,
  };
}

/** The names are what the server action parses, so assert on them directly. */
function fieldNames(container: HTMLElement): string[] {
  return [...container.querySelectorAll<HTMLInputElement>("input[name^='addresses.']")]
    .map((input) => input.name)
    .filter((name) => name.endsWith(".city"));
}

describe("AddressFields", () => {
  it("says so when a contact has no addresses", () => {
    render(<AddressFields />);

    expect(screen.getByText(/no addresses yet/i)).toBeInTheDocument();
  });

  it("renders one editor per stored address", () => {
    const { container } = render(
      <AddressFields
        defaultValue={[row({ city: "London" }), row({ type: "work", city: "Surrey" })]}
      />,
    );

    expect(fieldNames(container)).toEqual(["addresses.0.city", "addresses.1.city"]);
    expect(screen.getByDisplayValue("London")).toBeInTheDocument();
  });

  it("adds a row, named at the next position", async () => {
    const { container } = render(<AddressFields defaultValue={[row()]} />);

    await userEvent.click(screen.getByRole("button", { name: /add address/i }));

    expect(fieldNames(container)).toEqual(["addresses.0.city", "addresses.1.city"]);
  });

  it("re-packs the positions when a row is removed", async () => {
    const { container } = render(
      <AddressFields
        defaultValue={[row({ city: "First" }), row({ city: "Second" }), row({ city: "Third" })]}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /remove address 2/i }));

    expect(fieldNames(container)).toEqual(["addresses.0.city", "addresses.1.city"]);
    expect(screen.getByDisplayValue("Third")).toBeInTheDocument();
    expect(screen.queryByDisplayValue("Second")).not.toBeInTheDocument();
  });

  it("keeps each row's type picker in its own radio group", () => {
    render(<AddressFields defaultValue={[row(), row({ type: "work" })]} />);

    const first = screen.getByRole("radiogroup", { name: /address 1 type/i });
    const second = screen.getByRole("radiogroup", { name: /address 2 type/i });

    expect(within(first).getByRole("radio", { name: "Home" })).toBeChecked();
    expect(within(second).getByRole("radio", { name: "Work" })).toBeChecked();
  });

  it("switches a row's type without touching its neighbour", async () => {
    render(<AddressFields defaultValue={[row(), row()]} />);

    const second = screen.getByRole("radiogroup", { name: /address 2 type/i });
    await userEvent.click(within(second).getByRole("radio", { name: "Other" }));

    expect(within(second).getByRole("radio", { name: "Other" })).toBeChecked();
    const first = screen.getByRole("radiogroup", { name: /address 1 type/i });
    expect(within(first).getByRole("radio", { name: "Home" })).toBeChecked();
  });

  it("shows a server error against the row it belongs to", () => {
    render(
      <AddressFields
        defaultValue={[row(), row()]}
        errors={{ 1: { postal_code: "Postal code must be 20 characters or fewer" } }}
      />,
    );

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(/20 characters or fewer/);
    expect(document.querySelector("input[aria-invalid='true']")).toHaveAttribute(
      "name",
      "addresses.1.postal_code",
    );
  });

  it("stops adding rows at the API's ceiling", async () => {
    render(<AddressFields defaultValue={Array.from({ length: 20 }, () => row())} />);

    expect(screen.getByRole("button", { name: /add address/i })).toBeDisabled();
    expect(screen.getByText(/maximum of 20 addresses/i)).toBeInTheDocument();
  });
});
