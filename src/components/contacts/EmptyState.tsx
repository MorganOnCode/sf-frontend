import Link from "next/link";
import { Plus, SearchX, Users } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";
import Blueprint, { CornerMarks } from "@/components/ui/Blueprint";

/** Shown when the list has nothing in it — either truly empty or filtered out. */
export default function EmptyState({
  searchTerm,
  clearHref,
}: {
  searchTerm?: string;
  clearHref: string;
}) {
  const filtered = Boolean(searchTerm);
  const Icon = filtered ? SearchX : Users;

  return (
    <Blueprint className="p-7">
      {/* A dashed inner rule reads as a space left blank on the sheet. */}
      <div className="grid justify-items-center gap-1.5 border border-dashed border-border px-6 py-12 text-center">
        <Icon
          className={filtered ? "h-7 w-7 text-muted-foreground" : "h-7 w-7 text-primary"}
          strokeWidth={1.5}
          aria-hidden="true"
        />
        <h2 className="mt-1.5 font-display text-base font-semibold text-foreground">
          {filtered ? "No matching contacts" : "No contacts yet"}
        </h2>
        <p className="max-w-[38ch] text-[13px] text-muted-foreground">
          {filtered ? (
            <>
              Nothing matches <span className="text-foreground">“{searchTerm}”</span>.
              Try a shorter term, or clear the search.
            </>
          ) : (
            "Add the first one and it will show up here."
          )}
        </p>

        <div className="mt-2.5 flex justify-center gap-2">
          {filtered ? (
            <Link href={clearHref} className={buttonClasses("secondary")}>
              Clear search
            </Link>
          ) : null}
          <Link href="/contacts/new" className={buttonClasses("primary")}>
            <CornerMarks />
            <Plus className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
            New contact
          </Link>
        </div>
      </div>
    </Blueprint>
  );
}
