import "server-only";
import { cookies, headers } from "next/headers";
import { ACCESS_COOKIE } from "@/lib/auth-cookies";
import { getApiUrl } from "@/lib/env";

export async function getToken(): Promise<string | undefined> {
  return (await cookies()).get(ACCESS_COOKIE)?.value;
}

/** Forward the visitor's IP so the API's rate limits apply per user. */
export async function forwardHeaders(): Promise<Record<string, string>> {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim();
  return ip ? { "X-Forwarded-For": ip } : {};
}

export function detailOf(data: unknown): string {
  if (data && typeof data === "object" && "detail" in data) {
    const detail = (data as { detail: unknown }).detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      const messages = detail
        .map((item) => (item && typeof item === "object" && "msg" in item ? String((item as { msg: unknown }).msg) : ""))
        .filter(Boolean);
      if (messages.length) return messages.join(". ");
    }
  }
  return "Something went wrong. Please try again.";
}

/** Download a file from the API using the signed-in user's token. */
export async function proxyDownload(path: string, fallbackName: string): Promise<Response> {
  const token = await getToken();
  if (!token) return new Response("Please sign in again.", { status: 401 });

  let upstream: Response;
  try {
    upstream = await fetch(`${getApiUrl()}${path}`, {
      headers: { Authorization: `Bearer ${token}`, ...(await forwardHeaders()) },
      cache: "no-store",
      signal: AbortSignal.timeout(60_000),
    });
  } catch {
    return new Response("We couldn't reach the server. Please try again.", { status: 502 });
  }

  if (!upstream.ok) {
    const message = detailOf(await upstream.json().catch(() => null));
    const status = upstream.status === 403 ? 404 : upstream.status; // don't reveal other people's draws
    return new Response(message, { status: [400, 401, 404, 409, 429].includes(status) ? status : 502 });
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "application/octet-stream",
      "Content-Disposition":
        upstream.headers.get("content-disposition") ?? `attachment; filename="${fallbackName}"`,
      "Cache-Control": "no-store",
    },
  });
}