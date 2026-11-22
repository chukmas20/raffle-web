import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ApiError, apiFetch } from "@/lib/api";
import { ACCESS_COOKIE } from "@/lib/auth-cookies";
import type { FormState } from "@/types/forms";

export type Feedback = NonNullable<FormState>;

export const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();

export async function requireToken(): Promise<string> {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) redirect("/login");
  return token;
}

export function toFeedback(error: unknown): Feedback {
  if (error instanceof ApiError) {
    if (error.status === 401) redirect("/login");
    if (error.status === 429) return { message: "Too many requests. Please wait a moment and try again." };
    if (error.status === 0 || error.status >= 500) {
      return { message: "We couldn't reach the server. Please try again shortly." };
    }
    return { message: error.detail };
  }
  return { message: "Something went wrong. Please try again." };
}

type Result<T> = { data: T; error?: undefined } | { data?: undefined; error: Feedback };

export async function mutate<T = unknown>(
  path: string,
  method: "POST" | "PATCH" | "DELETE",
  body?: unknown,
): Promise<Result<T>> {
  const token = await requireToken();
  try {
    return { data: await apiFetch<T>(path, { method, token, body }) };
  } catch (error) {
    return { error: toFeedback(error) };
  }
}