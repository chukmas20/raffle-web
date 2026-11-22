const AUTH_PAGES = /^\/(login|register|forgot-password|reset-password)(\/|\?|$)/;

/** Only allow same-site relative paths, so `?next=` can't be used for open redirects. */
export function safeNextPath(value: string | null | undefined, fallback = "/dashboard"): string {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  if (/[\u0000-\u001f]/.test(value)) return fallback;
  if (AUTH_PAGES.test(value)) return fallback;
  return value;
}