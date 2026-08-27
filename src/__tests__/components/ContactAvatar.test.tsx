import React from "react";
import { render, screen } from "@testing-library/react";
import ContactAvatar from "@/components/contacts/ContactAvatar";
import { makeContact } from "../mocks/handlers";

const PHOTO = "data:image/jpeg;base64,AAAA";

describe("ContactAvatar", () => {
  it("falls back to initials when the contact has no photo", () => {
    const { container } = render(<ContactAvatar contact={makeContact()} />);

    expect(screen.getByText("AL")).toBeInTheDocument();
    expect(container.querySelector("img")).toBeNull();
  });

  it("shows the photo when there is one", () => {
    const { container } = render(
      <ContactAvatar contact={makeContact({ photo: PHOTO })} />,
    );

    const image = container.querySelector("img");
    expect(image).toHaveAttribute("src", PHOTO);
    expect(screen.queryByText("AL")).not.toBeInTheDocument();
  });

  it("renders the photo as a circle, LinkedIn style", () => {
    const { container } = render(
      <ContactAvatar contact={makeContact({ photo: PHOTO })} size="lg" />,
    );

    expect(container.querySelector("img")).toHaveClass(
      "rounded-full",
      "aspect-square",
      "object-cover",
    );
  });

  it("keeps the photo decorative — the name is already beside it", () => {
    const { container } = render(
      <ContactAvatar contact={makeContact({ photo: PHOTO })} />,
    );

    expect(container.querySelector("img")).toHaveAttribute("aria-hidden", "true");
  });
});
