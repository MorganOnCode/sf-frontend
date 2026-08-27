"use client";

import { useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Blueprint from "@/components/ui/Blueprint";
import { ADDRESS_FIELDS, type AddressFieldName } from "@/lib/contacts/schema";
import {
  ADDRESS_TYPES,
  ADDRESS_TYPE_LABELS,
  MAX_ADDRESSES,
  type AddressFormValues,
  type AddressType,
} from "@/lib/contacts/types";

/** A row keeps its own key so removing one does not reshuffle the others. */
type Row = { key: string; values: AddressFormValues };

function blankAddress(): AddressFormValues {
  return {
    type: "home",
    street: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
  };
}

/** Controls are named by position, so the rows survive a submit without JS. */
function fieldName(index: number, field: AddressFieldName): string {
  return `addresses.${index}.${field}`;
}

/**
 * The repeatable address editor.
 *
 * A contact has many addresses, so this is a list rather than a fixed block of
 * inputs. Only the type is held in React state — the text inputs stay
 * uncontrolled, so typing costs no re-render and a removed row cannot take a
 * neighbour's value with it.
 */
export default function AddressFields({
  defaultValue = [],
  errors = {},
}: {
  defaultValue?: AddressFormValues[];
  errors?: Record<number, Partial<Record<AddressFieldName, string>>>;
}) {
  const [rows, setRows] = useState<Row[]>(() =>
    defaultValue.map((values, index) => ({ key: `address-${index}`, values })),
  );
  const nextKey = useRef(defaultValue.length);

  const full = rows.length >= MAX_ADDRESSES;

  function add() {
    setRows((current) => [
      ...current,
      { key: `address-${nextKey.current++}`, values: blankAddress() },
    ]);
  }

  function remove(key: string) {
    setRows((current) => current.filter((row) => row.key !== key));
  }

  function setType(key: string, type: AddressType) {
    setRows((current) =>
      current.map((row) =>
        row.key === key ? { ...row, values: { ...row.values, type } } : row,
      ),
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-4 border-b border-hairline pb-1.5">
        <div>
          <h2 className="font-display text-base font-semibold text-foreground">
            Addresses
          </h2>
          <span className="text-xs text-muted-foreground">
            A contact can have several — each typed Home, Work, or Other.
          </span>
        </div>
        <Button variant="ghost" onClick={add} disabled={full}>
          <Plus className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
          Add address
        </Button>
      </div>

      {rows.length === 0 ? (
        <p className="border border-dashed border-border px-4 py-6 text-center text-[13px] text-muted-foreground">
          No addresses yet. Add one if you have it.
        </p>
      ) : null}

      {rows.map((row, index) => {
        const rowErrors = errors[index] ?? {};

        return (
          <Blueprint key={row.key} className="space-y-3 p-3">
            <div className="flex items-center justify-between gap-3">
              <div
                className="seg text-muted-foreground"
                role="radiogroup"
                aria-label={`Address ${index + 1} type`}
              >
                {ADDRESS_TYPES.map((type) => (
                  <label key={type} className="seg-opt">
                    <input
                      type="radio"
                      name={fieldName(index, "type")}
                      value={type}
                      checked={row.values.type === type}
                      onChange={() => setType(row.key, type)}
                    />
                    {ADDRESS_TYPE_LABELS[type]}
                  </label>
                ))}
              </div>

              <Button
                variant="ghost"
                onClick={() => remove(row.key)}
                aria-label={`Remove address ${index + 1}`}
                className="text-muted-foreground"
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
                Remove
              </Button>
            </div>

            {/* Street is given twice the room of the city beside it, and the
                three short fields share a row, as on an envelope. */}
            <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
              {ADDRESS_FIELDS.slice(0, 2).map((field) => (
                <AddressInputField
                  key={field.name}
                  field={field}
                  index={index}
                  defaultValue={row.values[field.name]}
                  error={rowErrors[field.name]}
                />
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {ADDRESS_FIELDS.slice(2).map((field) => (
                <AddressInputField
                  key={field.name}
                  field={field}
                  index={index}
                  defaultValue={row.values[field.name]}
                  error={rowErrors[field.name]}
                />
              ))}
            </div>
          </Blueprint>
        );
      })}

      {full ? (
        <p className="text-[13px] text-muted-foreground">
          That is the maximum of {MAX_ADDRESSES} addresses.
        </p>
      ) : null}
    </div>
  );
}

/** One control inside an address row. Mirrors `ui/Field`, minus the group grid. */
function AddressInputField({
  field,
  index,
  defaultValue,
  error,
}: {
  field: (typeof ADDRESS_FIELDS)[number];
  index: number;
  defaultValue?: string;
  error?: string;
}) {
  const id = `field-${fieldName(index, field.name)}`;
  const errorId = `${id}-error`;

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs text-foreground/70">
        {field.label}
      </label>
      <input
        id={id}
        name={fieldName(index, field.name)}
        defaultValue={defaultValue}
        maxLength={field.maxLength}
        placeholder={field.placeholder}
        autoComplete={field.autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`w-full min-h-9 border bg-input px-2.5 py-1.5 text-sm text-foreground caret-primary placeholder:text-muted-foreground/60 transition-colors ${
          error
            ? "border-destructive focus:border-destructive"
            : "border-border hover:border-foreground/45 focus:border-primary"
        }`}
      />
      {error ? (
        <p id={errorId} role="alert" className="mt-1.5 text-[13px] text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
