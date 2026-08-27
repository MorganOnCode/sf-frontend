"use client";

import { useState, type CSSProperties } from "react";
import { avatarHue, initials } from "@/lib/contacts/format";
import { photoSrc } from "@/lib/contacts/photo";
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
 * What the avatar needs. A single-contact read inlines `photo`; a list row
 * carries `id` and `has_photo` instead, and `photoSrc` resolves either.
 */
export type AvatarContact = Pick<
  Contact,
  "first_name" | "last_name" | "email"
> & {
  id?: number;
  photo?: string | null;
  has_photo?: boolean;
};

/**
 * A contact's photo as a circular image, falling back to their initials —
 * tinted with a hue derived from their email — when there is no photo.
 */
export default function ContactAvatar({
  contact,
  size = "md",
}: {
  contact: AvatarContact;
  size?: AvatarSize;
}) {
  // A list row only claims a photo exists; fetching it can still fail — the
  // contact may have lost its photo since the page rendered, or the API may be
  // down, and the route answers 404/502 either way. Remembering *which* source
  // failed drops us to the initials rather than an empty circle, while leaving a
  // later, different source free to try.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const src = photoSrc(contact);

  if (src && src !== failedSrc) {
    return (
      // The source is either a base64 `data:` URL or this app's own photo route,
      // neither of which next/image can optimise — a plain <img> is correct here.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        onError={() => setFailedSrc(src)}
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
