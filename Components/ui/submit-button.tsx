"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  pendingText = "Please wait…",
}: {
  children: React.ReactNode;
  pendingText?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-crimson-600 px-4 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-crimson-600/20 transition hover:bg-crimson-700 focus-visible:outline-offset-4 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? (
        <>
          <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
            <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
          {pendingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}