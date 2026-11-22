"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { buttonBase, buttonSizes, buttonStyles } from "@/Components/ui/styles";
import type { FormState } from "@/types/forms";

type Variant = keyof typeof buttonStyles;
type Size = keyof typeof buttonSizes;

function SubmitButton({
  label,
  pendingText,
  variant,
  size,
}: {
  label: string;
  pendingText: string;
  variant: Variant;
  size: Size;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`${buttonBase} ${buttonStyles[variant]} ${buttonSizes[size]}`}
    >
      {pending ? pendingText : label}
    </button>
  );
}

export function ActionForm({
  action,
  label,
  pendingText = "Working…",
  confirm,
  variant = "primary",
  size = "md",
  className = "",
  children,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  label: string;
  pendingText?: string;
  confirm?: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children?: React.ReactNode;
}) {
  const [state, formAction] = useActionState(action, undefined);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (confirm && !window.confirm(confirm)) event.preventDefault();
      }}
      className={className}
    >
      {children}
      <SubmitButton label={label} pendingText={pendingText} variant={variant} size={size} />
      {state?.message && (
        <p
          role={state.ok ? "status" : "alert"}
          className={`mt-2 w-full text-sm ${state.ok ? "text-navy-700" : "text-crimson-700"}`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}