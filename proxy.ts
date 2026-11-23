import { NextResponse, type NextRequest } from "next/server";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  buildAuthCookies,
  expiredCookieOptions,
  type TokenPair,
} from "@/lib/auth-cookies";
import { getApiUrl } from "@/lib/env";

const PUBLIC_PATHS = ["/login", "/register", "/forgot-password", "/reset-password","/draw","/api/public"];

const isPublicPath = (pathname: string) =>
  PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));

type RefreshResult =
  | { status: "ok"; tokens: TokenPair }
  | { status: "invalid" }
  | { status: "unavailable" };

async function refreshTokens(refreshToken: string, request: NextRequest): Promise<RefreshResult> {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  try {
    const response = await fetch(`${getApiUrl()}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(forwardedFor ? { "X-Forwarded-For": forwardedFor } : {}),
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
    if (response.ok) return { status: "ok", tokens: (await response.json()) as TokenPair };
    if (response.status === 401) return { status: "invalid" };
    return { status: "unavailable" };
  } catch {
    return { status: "unavailable" };
  }
}

function continueWithTokens(request: NextRequest, tokens: TokenPair) {
  const cookies = buildAuthCookies(tokens);
  // Update the incoming request too, so this same request's pages see the fresh tokens.
  for (const cookie of cookies) request.cookies.set(cookie.name, cookie.value);
  const response = NextResponse.next({ request });
  for (const cookie of cookies) response.cookies.set(cookie.name, cookie.value, cookie.options);
  return response;
}

function clearAuthCookies(response: NextResponse) {
  for (const name of [ACCESS_COOKIE, REFRESH_COOKIE]) {
    response.cookies.set(name, "", expiredCookieOptions());
  }
  return response;
}

function redirectToLogin(request: NextRequest) {
  const url = request.nextUrl.clone();
  const next = request.nextUrl.pathname + request.nextUrl.search;
  url.pathname = "/login";
  url.search = "";
  url.searchParams.set("next", next);
  return NextResponse.redirect(url);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;
  const loginRequired = !isPublicPath(pathname);

  // Access token expired (its cookie is gone) but we still hold a refresh token: renew silently.
  if (!access && refresh) {
    const result = await refreshTokens(refresh, request);
    if (result.status === "ok") return continueWithTokens(request, result.tokens);
    if (result.status === "invalid") {
      const response = loginRequired ? redirectToLogin(request) : NextResponse.next();
      return clearAuthCookies(response);
    }
    // API temporarily unreachable: keep the cookies so an outage doesn't sign everyone out.
  }

  if (!access && loginRequired) return redirectToLogin(request);
  return NextResponse.next();
}

export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico|woff2?|ttf)$).*)",
      // Skip link prefetches so they don't trigger token refreshes.
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};