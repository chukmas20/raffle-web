import type { MediaKind } from "@/types/api";

export const MB = 1024 * 1024;
export type MediaClass = "audio" | "video" | "image";

// Keep in sync with the API limits.
export const MAX_SIZE: Record<MediaClass, number> = {
  audio: 12.5 * MB,
  video: 150 * MB,
  image: 5 * MB,
};
export const LIMITS_TEXT = "Audio up to 12.5 MB · Video up to 150 MB · Images up to 5 MB";

export const KIND_LABELS: Record<MediaKind, string> = {
  music: "Background music",
  audio: "Audio clip",
  video: "Video",
  advert: "Advert",
};

export const KIND_ALLOWS: Record<MediaKind, MediaClass[]> = {
  music: ["audio"],
  audio: ["audio"],
  video: ["video"],
  advert: ["image", "video", "audio"],
};

const ALLOWED_TYPES = new Set([
  "audio/mpeg", "audio/mp4", "audio/aac", "audio/wav", "audio/ogg",
  "video/mp4", "video/webm", "video/quicktime",
  "image/jpeg", "image/png", "image/webp",
]);

// Browsers (especially on Windows) report the same format under different names.
const ALIASES: Record<string, string> = {
  "audio/mp3": "audio/mpeg",
  "audio/x-mpeg": "audio/mpeg",
  "audio/x-m4a": "audio/mp4",
  "audio/m4a": "audio/mp4",
  "audio/x-wav": "audio/wav",
  "audio/wave": "audio/wav",
  "audio/vnd.wave": "audio/wav",
  "audio/x-aac": "audio/aac",
  "audio/x-ogg": "audio/ogg",
  "image/jpg": "image/jpeg",
};

const BY_EXTENSION: Record<string, string> = {
  mp3: "audio/mpeg", m4a: "audio/mp4", aac: "audio/aac", wav: "audio/wav", ogg: "audio/ogg",
  mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime",
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp",
};

export function detectContentType(file: File): string | null {
  const raw = file.type.toLowerCase().split(";")[0].trim();
  const normalized = ALIASES[raw] ?? raw;
  if (ALLOWED_TYPES.has(normalized)) return normalized;
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return BY_EXTENSION[extension] ?? null;
}

export const mediaClassOf = (contentType: string) => contentType.split("/")[0] as MediaClass;

export function formatBytes(bytes: number): string {
  if (bytes >= MB) return `${(bytes / MB).toFixed(bytes >= 10 * MB ? 0 : 1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}