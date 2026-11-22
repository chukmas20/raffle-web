export function getApiUrl(): string {
  const url = process.env.API_URL;
  if (!url) throw new Error("API_URL is not set. Add it to .env.local");
  return url.replace(/\/+$/, "");
}