import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
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

describe("ContactAvatar on a list row", () => {
  const ROW = {
    id: 7,
    first_name: "Grace",
    last_name: "Hopper",
    email: "grace@example.com",
  };

  it("fetches the photo by URL, because list rows carry no inline photo", () => {
    const { container } = render(
      <ContactAvatar contact={{ ...ROW, has_photo: true }} />,
    );

    expect(container.querySelector("img")).toHaveAttribute(
      "src",
      "/api/contacts/7/photo/",
    );
  });

  it("falls back to initials when the photo cannot be loaded", () => {
    // The row was rendered from a list that said a photo existed; the request
    // for it can still come back 404 or 502.
    const { container } = render(
      <ContactAvatar contact={{ ...ROW, has_photo: true }} />,
    );

    fireEvent.error(container.querySelector("img")!);

    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText("GH")).toBeInTheDocument();
  });

  it("shows initials when the row says there is no photo", () => {
    const { container } = render(
      <ContactAvatar contact={{ ...ROW, has_photo: false }} />,
    );

    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText("GH")).toBeInTheDocument();
  });
});
