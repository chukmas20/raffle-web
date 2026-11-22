"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { Alert } from "@/Components/ui/alert";
import { CheckboxField, SelectField, TextAreaField, TextField } from "@/Components/ui/field";
import { SubmitButton } from "@/Components/ui/submit-button";
import type { FormState } from "@/types/forms";

type Row = { id: number; name: string; prize: string; winners: string };

function CategoryRepeater({ initial, error }: { initial: Row[]; error?: string }) {
  const nextId = useRef(initial.length + 1);
  const [rows, setRows] = useState<Row[]>(
    initial.length ? initial : [{ id: 0, name: "", prize: "", winners: "1" }],
  );

  const inputClass =
    "block w-full rounded-xl border border-navy-200 bg-white px-3.5 py-2.5 text-[15px] text-navy-900 placeholder:text-navy-300 focus:border-navy-700 focus:outline-none focus:ring-4 focus:ring-navy-100";

  return (
    <fieldset>
      <legend className="mb-1 text-sm font-semibold text-navy-800">Prizes (child draws)</legend>
      <p className="mb-3 text-sm text-navy-500">
        For example a church harvest can have a Car Draw, a Cow Draw and Consolation Prizes. All
        prizes draw from the same pool of tickets.
      </p>

      <div className="space-y-3">
        {rows.map((row, index) => (
          <div key={row.id} className="rounded-xl border border-navy-100 bg-navy-50/50 p-3">
            <div className="grid gap-3 sm:grid-cols-[1fr_1fr_6rem]">
              <input name="categoryName" defaultValue={row.name} placeholder="Prize name (Car Draw)" aria-label={`Prize ${index + 1} name`} className={inputClass} />
              <input name="categoryPrize" defaultValue={row.prize} placeholder="Prize (Toyota Corolla)" aria-label={`Prize ${index + 1} description`} className={inputClass} />
              <input name="categoryWinners" type="number" min={1} max={1000} defaultValue={row.winners} aria-label={`Prize ${index + 1} number of winners`} className={inputClass} />
            </div>
            {rows.length > 1 && (
              <button
                type="button"
                onClick={() => setRows((current) => current.filter((r) => r.id !== row.id))}
                className="mt-2 text-sm font-semibold text-crimson-700 hover:text-crimson-800"
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>

      <p className="mt-2 text-xs text-navy-500">The last box is the number of winners for that prize.</p>
      {error && <p role="alert" className="mt-2 text-sm text-crimson-700">{error}</p>}

      <button
        type="button"
        onClick={() =>
          setRows((current) => [...current, { id: nextId.current++, name: "", prize: "", winners: "1" }])
        }
        className="mt-3 text-sm font-semibold text-crimson-600 hover:text-crimson-700"
      >
        + Add another prize
      </button>
    </fieldset>
  );
}

export function DrawForm({
  action,
  cancelHref,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  cancelHref: string;
}) {
  const [state, formAction] = useActionState(action, undefined);
  const errors = state?.fieldErrors;

  let initialRows: Row[] = [];
  try {
    const parsed = JSON.parse(state?.values?.categories ?? "[]") as Omit<Row, "id">[];
    initialRows = parsed.map((row, index) => ({ ...row, id: index }));
  } catch {
    initialRows = [];
  }

  return (
    <form action={formAction} className="space-y-6" noValidate>
      {state?.message && <Alert tone="error">{state.message}</Alert>}

      <TextField
        label="Draw title"
        name="title"
        placeholder="Harvest 2026"
        defaultValue={state?.values?.title}
        error={errors?.title?.[0]}
        required
      />
      <TextAreaField
        label="Description (optional)"
        name="description"
        defaultValue={state?.values?.description}
        error={errors?.description?.[0]}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label="Draw date and time (optional)"
          name="scheduledAt"
          type="datetime-local"
          hint="Nigerian time (WAT)"
          defaultValue={state?.values?.scheduledAt}
          error={errors?.scheduledAt?.[0]}
        />
        <SelectField
          label="Ticket number length"
          name="ticketDigits"
          defaultValue={state?.values?.ticketDigits ?? "4"}
          hint="Can't be changed after tickets are generated."
          error={errors?.ticketDigits?.[0]}
        >
          <option value="4">4 digits (up to 9,999 tickets)</option>
          <option value="5">5 digits (up to 99,999 tickets)</option>
          <option value="6">6 digits (up to 999,999 tickets)</option>
        </SelectField>
      </div>

      <div className="space-y-4 rounded-xl border border-navy-100 p-4">
        <CheckboxField
          name="soldOnly"
          label="Only sold tickets can win"
          hint="Recommended. Mark tickets as sold before running the draw."
          defaultChecked={state?.values?.soldOnly !== "off"}
        />
        <CheckboxField
          name="excludeWinners"
          label="A ticket can win only once"
          hint="Winners of one prize are removed from the other prizes' draws."
          defaultChecked={state?.values?.excludeWinners !== "off"}
        />
      </div>

      <CategoryRepeater
        key={state?.values?.categories ?? "initial"}
        initial={initialRows}
        error={errors?.categories?.[0]}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="sm:w-56">
          <SubmitButton pendingText="Creating draw…">Create draw</SubmitButton>
        </div>
        <Link href={cancelHref} className="text-center text-sm font-semibold text-navy-600 hover:text-crimson-600">
          Cancel
        </Link>
      </div>
    </form>
  );
}