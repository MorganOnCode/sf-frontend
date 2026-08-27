import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Pencil } from "lucide-react";
import ContactAvatar from "@/components/contacts/ContactAvatar";
import Blueprint from "@/components/ui/Blueprint";
import DeleteContactButton from "@/components/contacts/DeleteContactButton";
import { buttonClasses } from "@/components/ui/Button";
import { getContact } from "@/lib/contacts/api";
import { addressLine, formatTimestamp, jobLine } from "@/lib/contacts/format";

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
  const address = addressLine(contact);

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
        <Row label="Address">{address}</Row>
        <Row label="Notes">
          {contact.notes ? (
            <span className="whitespace-pre-wrap">{contact.notes}</span>
          ) : null}
        </Row>
      </Blueprint>

      <div className="flex flex-wrap gap-x-6 gap-y-1 border-t border-hairline pt-3 font-mono text-[11px] uppercase tracking-wide">
        <MetaCell label="ID" value={String(contact.id)} />
        <MetaCell label="Created" value={formatTimestamp(contact.created_at)} />
        <MetaCell label="Updated" value={formatTimestamp(contact.updated_at)} />
      </div>
    </div>
  );
}
