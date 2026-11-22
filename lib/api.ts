import "server-only";
import { headers } from "next/headers";
import { getApiUrl } from "@/lib/env";

export class ApiError extends Error {
  constructor(
    public status: number,
    public detail: string,
  ) {
    super(detail);
    this.name = "ApiError";
  }
}

export type ApiOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  token?: string;
};

function parseDetail(body: unknown): string {
  if (body && typeof body === "object" && "detail" in body) {
    const detail = (body as { detail: unknown }).detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      const messages = detail
        .map((item) =>
          item && typeof item === "object" && "msg" in item
            ? String((item as { msg: unknown }).msg)
            : "",
        )
        .filter(Boolean);
      if (messages.length) return messages.join(". ");
    }
  }
  return "Something went wrong. Please try again.";
}

/** Server-to-server call to the FastAPI backend. Never import this from client code. */
export async function apiFetch<T = unknown>(
  path: string,
  { method = "GET", body, token }: ApiOptions = {},
): Promise<T> {
  // Forward the visitor's IP so the API's rate limits apply per user, not per Next.js server.
  const incoming = await headers();
  const forwardedFor = incoming.get("x-forwarded-for")?.split(",")[0]?.trim();

  let response: Response;
  try {
    response = await fetch(`${getApiUrl()}${path}`, {
      method,
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(forwardedFor ? { "X-Forwarded-For": forwardedFor } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new ApiError(0, "Could not reach the server");
  }

  if (response.status === 204) return undefined as T;
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(response.status, parseDetail(data));
  return data as T;
}