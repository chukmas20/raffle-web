"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ApiError, apiFetch } from "@/lib/api";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  buildAuthCookies,
  expiredCookieOptions,
  type TokenPair,
} from "@/lib/auth-cookies";
import { safeNextPath } from "@/lib/safe-redirect";
import {
  changePasswordSchema,
  fieldErrorsFrom,
  forgotSchema,
  loginSchema,
  registerSchema,
  resetSchema,
} from "@/lib/validation";
import type { FormState } from "@/types/forms";

async function setAuthCookies(tokens: TokenPair) {
  const store = await cookies();
  for (const cookie of buildAuthCookies(tokens)) {
    store.set(cookie.name, cookie.value, cookie.options);
  }
}

async function clearAuthCookies() {
  const store = await cookies();
  for (const name of [ACCESS_COOKIE, REFRESH_COOKIE]) {
    store.set(name, "", expiredCookieOptions());
  }
}

function friendlyError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 429) return "Too many attempts. Please wait a few minutes and try again.";
    if (error.status === 0 || error.status >= 500) {
      return "We couldn't reach the server. Please try again shortly.";
    }
    return error.detail;
  }
  return "Something went wrong. Please try again.";
}

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "");

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = text(formData, "email");
  const parsed = loginSchema.safeParse({ email, password: text(formData, "password") });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error), values: { email } };
  }

  try {
    const tokens = await apiFetch<TokenPair>("/auth/login", { method: "POST", body: parsed.data });
    await setAuthCookies(tokens);
  } catch (error) {
    return { message: friendlyError(error), values: { email } };
  }
  redirect(safeNextPath(text(formData, "next")));
}

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = { fullName: text(formData, "fullName"), email: text(formData, "email") };
  const parsed = registerSchema.safeParse({
    ...values,
    password: text(formData, "password"),
    confirmPassword: text(formData, "confirmPassword"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error), values };

  const { fullName, email, password } = parsed.data;
  try {
    await apiFetch("/auth/register", {
      method: "POST",
      body: { email, full_name: fullName, password },
    });
  } catch (error) {
    return { message: friendlyError(error), values };
  }

  try {
    const tokens = await apiFetch<TokenPair>("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    await setAuthCookies(tokens);
  } catch {
    redirect("/login?registered=1");
  }
  redirect("/dashboard");
}

export async function forgotPasswordAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = text(formData, "email");
  const parsed = forgotSchema.safeParse({ email });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error), values: { email } };

  try {
    await apiFetch("/auth/forgot-password", { method: "POST", body: parsed.data });
  } catch (error) {
    const clientError =
      error instanceof ApiError && error.status >= 400 && error.status < 500 && error.status !== 429;
    // Never reveal whether an account exists: other 4xx errors still show the generic message.
    if (!clientError) return { message: friendlyError(error), values: { email } };
  }
  return {
    ok: true,
    message:
      "If an account exists for that email, we've sent a password reset link. Check your inbox and spam folder.",
  };
}

export async function resetPasswordAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = resetSchema.safeParse({
    token: text(formData, "token"),
    password: text(formData, "password"),
    confirmPassword: text(formData, "confirmPassword"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  try {
    await apiFetch("/auth/reset-password", {
      method: "POST",
      body: { token: parsed.data.token, new_password: parsed.data.password },
    });
  } catch (error) {
    return { message: friendlyError(error) };
  }
  redirect("/login?reset=1");
}

export async function changePasswordAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) redirect("/login");

  const parsed = changePasswordSchema.safeParse({
    currentPassword: text(formData, "currentPassword"),
    newPassword: text(formData, "newPassword"),
    confirmPassword: text(formData, "confirmPassword"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  try {
    await apiFetch("/users/me/change-password", {
      method: "POST",
      token,
      body: {
        current_password: parsed.data.currentPassword,
        new_password: parsed.data.newPassword,
      },
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) redirect("/login");
    if (error instanceof ApiError && error.status === 400) {
      const field = /different/i.test(error.detail) ? "newPassword" : "currentPassword";
      return { fieldErrors: { [field]: [error.detail] } };
    }
    return { message: friendlyError(error) };
  }

  // The API signs out every session after a password change, so clear ours too.
  await clearAuthCookies();
  redirect("/login?changed=1");
}

export async function logoutAction(): Promise<void> {
  const refreshToken = (await cookies()).get(REFRESH_COOKIE)?.value;
  if (refreshToken) {
    try {
      await apiFetch("/auth/logout", { method: "POST", body: { refresh_token: refreshToken } });
    } catch {
      // Even if the API call fails, still sign the user out locally.
    }
  }
  await clearAuthCookies();
  redirect("/login");
}