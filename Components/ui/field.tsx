"use client";

import { useEffect, useId, useRef, useState, type ComponentProps } from "react";

type FieldProps = Omit<ComponentProps<"input">, "name"> & {
  label: string;
  name: string;
  error?: string;
  hint?: string;
};



const inputClasses = (invalid: boolean) =>
  `block w-full rounded-xl border bg-white px-4 py-3 text-[15px] text-navy-900 shadow-sm transition placeholder:text-navy-300 focus:outline-none focus:ring-4 ${
    invalid
      ? "border-crimson-500 focus:border-crimson-600 focus:ring-crimson-100"
      : "border-navy-200 hover:border-navy-300 focus:border-navy-700 focus:ring-navy-100"
  }`;

const labelClasses = "mb-1.5 block text-sm font-semibold text-navy-800";

function Message({ id, error, hint }: { id: string; error?: string; hint?: string }) {
  if (error) {
    return (
      <p id={id} role="alert" className="mt-1.5 text-sm text-crimson-700">
        {error}
      </p>
    );
  }
  if (hint) {
    return (
      <p id={id} className="mt-1.5 text-sm text-navy-500">
        {hint}
      </p>
    );
  }
  return null;
}

export function TextField({ label, error, hint, ...props }: FieldProps) {
  const id = useId();
  const messageId = `${id}-message`;
  return (
    <div>
      <label htmlFor={id} className={labelClasses}>
        {label}
      </label>
      <input
        {...props}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? messageId : undefined}
        className={inputClasses(!!error)}
      />
      <Message id={messageId} error={error} hint={hint} />
    </div>
  );
}

const RULES = [
  { label: "8+ characters", test: (v: string) => v.length >= 8 },
  { label: "Uppercase letter", test: (v: string) => /[A-Z]/.test(v) },
  { label: "Lowercase letter", test: (v: string) => /[a-z]/.test(v) },
  { label: "A number", test: (v: string) => /\d/.test(v) },
];

export function PasswordField({
  label,
  error,
  hint,
  showRules = false,
  ...props
}: FieldProps & { showRules?: boolean }) {
  const id = useId();
  const messageId = `${id}-message`;
  const [visible, setVisible] = useState(false);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // React clears the form after each submission, so clear the checklist with it.
  useEffect(() => {
    const form = inputRef.current?.form;
    if (!form) return;
    const onReset = () => setValue("");
    form.addEventListener("reset", onReset);
    return () => form.removeEventListener("reset", onReset);
  }, []);

  return (
    <div>
      <label htmlFor={id} className={labelClasses}>
        {label}
      </label>
      <div className="relative">
        <input
          {...props}
          ref={inputRef}
          id={id}
          type={visible ? "text" : "password"}
          onInput={(event) => setValue(event.currentTarget.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? messageId : undefined}
          className={`${inputClasses(!!error)} pr-12`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-navy-400 transition hover:text-navy-700"
        >
          {visible ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 3l18 18" />
              <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
              <path d="M9.9 5.1A9.8 9.8 0 0 1 12 5c5 0 8.5 4 9.5 7a11.7 11.7 0 0 1-2.6 3.9M6.5 6.5A11.7 11.7 0 0 0 2.5 12c1 3 4.5 7 9.5 7a9.6 9.6 0 0 0 4-.9" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M2.5 12C3.5 9 7 5 12 5s8.5 4 9.5 7c-1 3-4.5 7-9.5 7s-8.5-4-9.5-7Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
      <Message id={messageId} error={error} hint={hint} />
      {showRules && (
        <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs" aria-label="Password requirements">
          {RULES.map((rule) => {
            const ok = rule.test(value);
            return (
              <li
                key={rule.label}
                className={`flex items-center gap-1.5 ${ok ? "font-semibold text-navy-900" : "text-navy-500"}`}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  {ok ? (
                    <>
                      <circle cx="7" cy="7" r="7" className="fill-navy-900" />
                      <path d="M4 7.2l2 2 4-4" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </>
                  ) : (
                    <circle cx="7" cy="7" r="6" className="stroke-navy-300" strokeWidth="1.5" />
                  )}
                </svg>
                {rule.label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}


type ExtraProps = { label: string; name: string; error?: string; hint?: string };

export function TextAreaField({
  label,
  error,
  hint,
  ...props
}: ExtraProps & Omit<ComponentProps<"textarea">, "name">) {
  const id = useId();
  const messageId = `${id}-message`;
  return (
    <div>
      <label htmlFor={id} className={labelClasses}>{label}</label>
      <textarea
        {...props}
        id={id}
        rows={props.rows ?? 3}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? messageId : undefined}
        className={inputClasses(!!error)}
      />
      <Message id={messageId} error={error} hint={hint} />
    </div>
  );
}

export function SelectField({
  label,
  error,
  hint,
  children,
  ...props
}: ExtraProps & Omit<ComponentProps<"select">, "name">) {
  const id = useId();
  const messageId = `${id}-message`;
  return (
    <div>
      <label htmlFor={id} className={labelClasses}>{label}</label>
      <select
        {...props}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? messageId : undefined}
        className={inputClasses(!!error)}
      >
        {children}
      </select>
      <Message id={messageId} error={error} hint={hint} />
    </div>
  );
}

export function CheckboxField({
  label,
  hint,
  ...props
}: Omit<ComponentProps<"input">, "type"> & { label: string; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        {...props}
        type="checkbox"
        className="mt-0.5 size-4 shrink-0 rounded border-navy-300 accent-crimson-600"
      />
      <span className="text-sm">
        <span className="font-semibold text-navy-800">{label}</span>
        {hint && <span className="mt-0.5 block text-navy-500">{hint}</span>}
      </span>
    </label>
  );
}
