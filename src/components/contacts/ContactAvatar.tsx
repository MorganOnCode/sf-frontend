import type { CSSProperties } from "react";
import { avatarHue, initials } from "@/lib/contacts/format";
import type { Contact } from "@/lib/contacts/types";

const SIZES = {
  sm: "h-8 w-8 text-[11px]",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
  xl: "h-20 w-20 text-2xl",
} as const;

export type AvatarSize = keyof typeof SIZES;

/** Shape shared by both states, so a photo and an initials bubble line up exactly. */
const CIRCLE = "inline-flex shrink-0 select-none items-center justify-center rounded-full";

/**
 * A contact's photo as a circular image, falling back to their initials —
 * tinted with a hue derived from their email — when there is no photo.
 */
export default function ContactAvatar({
  contact,
  size = "md",
}: {
  contact: Pick<Contact, "first_name" | "last_name" | "email" | "photo">;
  size?: AvatarSize;
}) {
  if (contact.photo) {
    return (
      // The photo is a base64 `data:` URL, which next/image cannot optimise or
      // serve — a plain <img> is the right element for it.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={contact.photo}
        alt=""
        aria-hidden="true"
        className={`${CIRCLE} aspect-square border border-hairline object-cover ${SIZES[size]}`}
      />
    );
  }

  const style = { "--avatar-hue": avatarHue(contact.email) } as CSSProperties;

  return (
    <span
      aria-hidden="true"
      style={style}
      className={`contact-avatar ${CIRCLE} font-display font-semibold ${SIZES[size]}`}
    >
      {initials(contact)}
    </span>
  );
}
