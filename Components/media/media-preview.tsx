import type { DrawMedia } from "@/types/api";

export function MediaPreview({ item }: { item: Pick<DrawMedia, "url" | "media_type" | "title"> }) {
  if (item.media_type === "image") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={item.url} alt={item.title} loading="lazy" className="aspect-video w-full rounded-xl bg-navy-50 object-cover" />;
  }
  if (item.media_type === "video") {
    return <video src={item.url} controls preload="metadata" playsInline className="aspect-video w-full rounded-xl bg-black" />;
  }
  return <audio src={item.url} controls preload="none" className="w-full" />;
}