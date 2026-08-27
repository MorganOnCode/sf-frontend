import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PhotoField from "@/components/contacts/PhotoField";
import { makeContact } from "../mocks/handlers";

const PHOTO = "data:image/jpeg;base64,AAAA";

/** The hidden input is what the surrounding server action actually receives. */
function photoValue(container: HTMLElement): string | null {
  return container
    .querySelector<HTMLInputElement>('input[name="photo"]')!
    .getAttribute("value");
}

describe("PhotoField", () => {
  it("offers an upload when there is no photo yet", () => {
    const { container } = render(<PhotoField />);

    expect(screen.getByLabelText(/upload photo/i)).toHaveAttribute("type", "file");
    expect(photoValue(container)).toBe("");
    expect(
      screen.queryByRole("button", { name: /remove/i }),
    ).not.toBeInTheDocument();
  });

  it("accepts only the media types the API stores", () => {
    render(<PhotoField />);

    expect(screen.getByLabelText(/upload photo/i)).toHaveAttribute(
      "accept",
      "image/jpeg,image/png,image/gif,image/webp",
    );
  });

  it("carries an existing photo through the form, so editing cannot wipe it", () => {
    const { container } = render(<PhotoField defaultValue={PHOTO} />);

    expect(photoValue(container)).toBe(PHOTO);
    expect(screen.getByLabelText(/change photo/i)).toBeInTheDocument();
  });

  it("clears the photo when it is removed", async () => {
    const { container } = render(<PhotoField defaultValue={PHOTO} />);

    await userEvent.click(screen.getByRole("button", { name: /remove/i }));

    expect(photoValue(container)).toBe("");
    expect(screen.getByLabelText(/upload photo/i)).toBeInTheDocument();
  });

  it("previews the contact's initials while they have no photo", () => {
    render(<PhotoField contact={makeContact()} />);

    expect(screen.getByText("AL")).toBeInTheDocument();
  });

  it("surfaces a server-side error against the field", () => {
    render(<PhotoField error="Photo must be 2 MB or smaller" />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Photo must be 2 MB or smaller",
    );
  });
});
