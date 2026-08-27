import { initials } from "@/lib/contacts/format";
import { photoSrc } from "@/lib/contacts/photo";
import type { Contact } from "@/lib/contacts/types";

const SIZES = {
  sm: "h-[34px] w-[34px] text-[13px]",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
  xl: "h-[76px] w-[76px] text-2xl",
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
 * A contact's photo as a circular image, falling back to their initials.
 *
 * The circle is the system's one deliberate curve — everything else is square —
 * and the photograph is screen-printed into the accent by `.duotone`, so a
 * column of avatars reads as part of the drawing rather than against it.
 */
export default function ContactAvatar({
  contact,
  size = "md",
}: {
  contact: AvatarContact;
  size?: AvatarSize;
}) {
  const src = photoSrc(contact);

  if (src) {
    return (
      <span className={`duotone ${CIRCLE} ${SIZES[size]}`} aria-hidden="true">
        {/* The source is either a base64 `data:` URL or this app's own photo
            route, neither of which next/image can optimise. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-full w-full rounded-full object-cover"
        />
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`contact-avatar ${CIRCLE} font-display font-semibold ${SIZES[size]}`}
    >
      {initials(contact)}
    </span>
  );
}
