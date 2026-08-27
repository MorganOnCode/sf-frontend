"use client";

import { useEffect, useId, useRef, useState, type ChangeEvent } from "react";
import { ImageUp, Loader2, Trash2, UserRound } from "lucide-react";
import ContactAvatar from "./ContactAvatar";
import Button, { buttonClasses } from "@/components/ui/Button";
import {
  ACCEPTED_PHOTO_TYPES,
  PHOTO_MAX_EDGE,
  downscaleToDataUrl,
} from "@/lib/contacts/photo";
import type { Contact } from "@/lib/contacts/types";

/**
 * Refuse an absurd source file before decoding it. This is not the API's limit —
 * the picked image is resized to `PHOTO_MAX_EDGE` before upload, so what the API
 * sees is far smaller. It only stops us handing a 200 MB file to the decoder.
 */
const MAX_SOURCE_BYTES = 25 * 1024 * 1024;

/** Everything the initials fallback needs, minus the photo itself. */
type FallbackContact = Pick<Contact, "first_name" | "last_name" | "email">;

/**
 * Photo picker for the contact form.
 *
 * The chosen file never leaves the browser as a file: it is resized and
 * re-encoded as a base64 `data:` URL, then carried in a hidden input so the
 * surrounding server action receives it like any other field. Editing a contact
 * therefore round-trips the existing photo automatically — the `PUT` behind the
 * form clears anything it is not sent.
 */
export default function PhotoField({
  defaultValue = null,
  contact,
  error,
  onBusyChange,
}: {
  defaultValue?: string | null;
  contact?: FallbackContact;
  error?: string;
  /** Told when a conversion starts and finishes, so the form can hold Save. */
  onBusyChange?: (busy: boolean) => void;
}) {
  const [photo, setPhoto] = useState(defaultValue);
  const [pickerError, setPickerError] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);

  // Identifies the current selection. Every pick and every removal bumps it, so
  // a slow conversion that finishes late can tell it has been superseded and
  // drop its result instead of overwriting a newer choice.
  const selectionRef = useRef(0);

  const inputId = useId();
  const errorId = `${inputId}-error`;
  // A rejected file is the more recent news, so it wins over a stale server error.
  const message = pickerError ?? error;

  useEffect(() => onBusyChange?.(converting), [converting, onBusyChange]);

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Reset the input so picking the same file twice still fires a change.
    event.target.value = "";
    if (!file) return;

    const selection = (selectionRef.current += 1);
    const isCurrent = () => selectionRef.current === selection;

    // Picking supersedes whatever was converting, so that conversion will no
    // longer clear the busy state on its way out. A rejected file has to clear
    // it here, or Save stays disabled and this message stays hidden behind the
    // "Preparing photo…" line that outranks it.
    function reject(reason: string) {
      setPickerError(reason);
      setConverting(false);
    }

    if (!ACCEPTED_PHOTO_TYPES.includes(file.type)) {
      reject("Choose a JPEG, PNG, GIF, or WebP image.");
      return;
    }
    if (file.size > MAX_SOURCE_BYTES) {
      reject(
        `That file is over ${MAX_SOURCE_BYTES / 1024 / 1024} MB. Choose a smaller image.`,
      );
      return;
    }

    setConverting(true);
    try {
      const converted = await downscaleToDataUrl(file);
      if (!isCurrent()) return;
      setPhoto(converted);
      setPickerError(null);
    } catch {
      if (isCurrent()) {
        setPickerError("That image could not be read. Try a different file.");
      }
    } finally {
      if (isCurrent()) setConverting(false);
    }
  }

  function handleRemove() {
    // Bumping the selection also cancels a conversion still in flight, so it
    // cannot put the photo back after the user has removed it.
    selectionRef.current += 1;
    setPhoto(null);
    setPickerError(null);
    setConverting(false);
  }

  return (
    <div className="flex items-center gap-4">
      <input type="hidden" name="photo" value={photo ?? ""} />

      {photo ? (
        // Preview of a base64 `data:` URL, which next/image cannot optimise.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo}
          alt=""
          aria-hidden="true"
          className="inline-flex aspect-square h-20 w-20 shrink-0 rounded-full border border-hairline object-cover"
        />
      ) : contact ? (
        <ContactAvatar contact={{ ...contact, photo: null }} size="xl" />
      ) : (
        <span
          aria-hidden="true"
          className="inline-flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-dashed border-border text-muted-foreground/60"
        >
          <UserRound className="h-8 w-8" strokeWidth={1.5} />
        </span>
      )}

      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          {/* The input stays focusable but invisible; the label is the visible
              control and mirrors its focus ring via `peer-focus-visible`. */}
          <input
            id={inputId}
            type="file"
            accept={ACCEPTED_PHOTO_TYPES.join(",")}
            onChange={handleChange}
            aria-invalid={message ? true : undefined}
            aria-describedby={message ? errorId : undefined}
            className="peer sr-only"
          />
          <label
            htmlFor={inputId}
            className={buttonClasses(
              "secondary",
              "md",
              "cursor-pointer peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring",
            )}
          >
            <ImageUp className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            {photo ? "Change photo" : "Upload photo"}
          </label>

          {photo ? (
            <Button variant="ghost" onClick={handleRemove}>
              <Trash2 className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              Remove
            </Button>
          ) : null}
        </div>

        {converting ? (
          <p
            role="status"
            className="flex items-center gap-1.5 text-[13px] text-muted-foreground"
          >
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            Preparing photo…
          </p>
        ) : message ? (
          <p id={errorId} role="alert" className="text-[13px] text-destructive">
            {message}
          </p>
        ) : (
          <p className="text-[13px] text-muted-foreground">
            JPEG, PNG, GIF, or WebP — resized to {PHOTO_MAX_EDGE}px before
            upload. Without one, their initials are shown instead.
          </p>
        )}
      </div>
    </div>
  );
}
