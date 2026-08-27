import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Briefcase, ChevronLeft, House, MapPin, Pencil } from "lucide-react";
import ContactAvatar from "@/components/contacts/ContactAvatar";
import Blueprint from "@/components/ui/Blueprint";
import DeleteContactButton from "@/components/contacts/DeleteContactButton";
import { buttonClasses } from "@/components/ui/Button";
import { getContact } from "@/lib/contacts/api";
import {
  addressLines,
  formatTimestamp,
  groupAddressesByType,
  jobLine,
} from "@/lib/contacts/format";
import type { Address, AddressType } from "@/lib/contacts/types";

type PageProps = { params: Promise<{ id: string }> };

function parseId(raw: string): number {
  const id = Number.parseInt(raw, 10);
  if (!Number.isInteger(id) || id < 1) notFound();
  return id;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const contact = await getContact(parseId((await params).id));
  return {
    title: contact?.full_name ?? "Contact not found",
    description: contact ? jobLine(contact) ?? undefined : undefined,
  };
}

/** One line of the spec sheet: a narrow label column against its value. */
function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-hairline last:border-b-0 sm:grid-cols-[150px_1fr] sm:gap-0">
      <dt className="px-4 py-2.5 text-xs text-muted-foreground">{label}</dt>
      <dd className="break-words px-4 pb-2.5 text-sm text-foreground sm:pt-2.5">
        {children ?? <span className="text-muted-foreground/50">—</span>}
      </dd>
    </div>
  );
}

const TYPE_ICONS: Record<AddressType, typeof House> = {
  home: House,
  work: Briefcase,
  other: MapPin,
};

/** One address, drawn as its own small plate on the sheet. */
function AddressCard({ address, number }: { address: Address; number: number }) {
  const Icon = TYPE_ICONS[address.type];
  const lines = addressLines(address);

  return (
    <Blueprint className="flex flex-col gap-2 p-3">
      <div className="flex items-center justify-between gap-2">
        <span
          className={`tag gap-1.5 uppercase tracking-wider ${
            address.type === "other" ? "tag-neutral" : "tag-accent"
          }`}
        >
          <Icon className="h-3 w-3" strokeWidth={1.5} aria-hidden="true" />
          {address.type}
        </span>
        <span className="font-mono text-[10px] tracking-wider text-muted-foreground">
          ADDR-{String(number).padStart(2, "0")}
        </span>
      </div>

      {lines.length ? (
        <p className="text-[13px] leading-relaxed text-foreground">
          {lines.map((line, index) => (
            <span key={line + index} className="block">
              {line}
            </span>
          ))}
        </p>
      ) : (
        <p className="text-[13px] text-muted-foreground/60">No details recorded.</p>
      )}
    </Blueprint>
  );
}

/** The record's own numbers, set as a drawing's title block. */
function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex gap-1.5">
      <span className="text-muted-foreground">{label}</span>
      <b className="font-normal text-foreground">{value}</b>
    </span>
  );
}

export default async function ContactDetailPage({ params }: PageProps) {
  const contact = await getContact(parseId((await params).id));
  if (!contact) notFound();

  const subtitle = jobLine(contact);
  const groups = groupAddressesByType(contact.addresses);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <Link
        href="/contacts"
        className="inline-flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
        All contacts
      </Link>

      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-5">
          {/* The portrait is a figure on the sheet: framed and registered, even
              though the image inside it is the one round thing in the app. */}
          <Blueprint className="!border-0">
            <ContactAvatar contact={contact} size="xl" />
          </Blueprint>
          <div>
            <div className="kicker mb-0.5">Record {contact.id}</div>
            <h1 className="font-display text-[28px] font-semibold text-foreground">
              {contact.full_name}
            </h1>
            {subtitle ? (
              <p className="mt-0.5 text-[13px] text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/contacts/${contact.id}/edit`}
            className={buttonClasses("secondary")}
          >
            <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
            Edit
          </Link>
          <DeleteContactButton
            contactId={contact.id}
            contactName={contact.full_name}
            redirectToList
            variant="danger"
            size="md"
            withLabel
          />
        </div>
      </header>

      <Blueprint as="dl">
        <Row label="Email">
          <a href={`mailto:${contact.email}`} className="text-primary hover:underline">
            {contact.email}
          </a>
        </Row>
        <Row label="Phone">
          {contact.phone ? (
            <a href={`tel:${contact.phone}`} className="text-primary hover:underline">
              {contact.phone}
            </a>
          ) : null}
        </Row>
        <Row label="Company">{contact.company}</Row>
        <Row label="Job title">{contact.job_title}</Row>
        <Row label="Notes">
          {contact.notes ? (
            <span className="whitespace-pre-wrap">{contact.notes}</span>
          ) : null}
        </Row>
      </Blueprint>

      <section className="space-y-4">
        <h2 className="font-display text-[13px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          Addresses · {contact.addresses.length}
        </h2>

        {groups.length ? (
          // Grouped by type, in a fixed order, so a contact's home addresses
          // read together and the sections never reshuffle between renders.
          groups.map((group) => (
            <div key={group.type} className="space-y-2">
              <h3 className="text-xs text-muted-foreground">
                {group.label} · {group.addresses.length}
              </h3>
              <div className="grid gap-5 sm:grid-cols-2">
                {group.addresses.map((address) => (
                  <AddressCard
                    key={address.id}
                    address={address}
                    number={contact.addresses.indexOf(address) + 1}
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          <p className="border border-dashed border-border px-4 py-6 text-center text-[13px] text-muted-foreground">
            No addresses on file for {contact.first_name}.
          </p>
        )}
      </section>

      <div className="flex flex-wrap gap-x-6 gap-y-1 border-t border-hairline pt-3 font-mono text-[11px] uppercase tracking-wide">
        <MetaCell label="ID" value={String(contact.id)} />
        <MetaCell label="Created" value={formatTimestamp(contact.created_at)} />
        <MetaCell label="Updated" value={formatTimestamp(contact.updated_at)} />
      </div>
    </div>
  );
}
