export type TokenPair = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
};

export const IS_PROD = process.env.NODE_ENV === "production";

// The __Host- prefix makes browsers reject the cookie unless it is Secure, path=/ and
// has no Domain, which blocks cookie-injection from sibling subdomains. It needs HTTPS,
// so it is only used in production.
const PREFIX = IS_PROD ? "__Host-" : "";
export const ACCESS_COOKIE = `${PREFIX}ra_at`;
export const REFRESH_COOKIE = `${PREFIX}ra_rt`;

// Keep in sync with REFRESH_TOKEN_EXPIRE_DAYS on the API.
const REFRESH_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

const baseOptions = {
  httpOnly: true,
  secure: IS_PROD,
  sameSite: "lax" as const,
  path: "/",
};

export function buildAuthCookies(tokens: TokenPair) {
  return [
    {
      name: ACCESS_COOKIE,
      value: tokens.access_token,
      // Expire the cookie slightly before the token so an expired token is never sent.
      options: { ...baseOptions, maxAge: Math.max(tokens.expires_in - 30, 60) },
    },
    {
      name: REFRESH_COOKIE,
      value: tokens.refresh_token,
      options: { ...baseOptions, maxAge: REFRESH_MAX_AGE_SECONDS },
    },
  ];
}

export function expiredCookieOptions() {
  return { ...baseOptions, maxAge: 0 };
}