import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isUuid } from "@/lib/ids";
import { getPublicDraw } from "@/lib/public-api";
import { LiveDraw } from "@/Components/public/live-draw";

type Props = { params: Promise<{ drawId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { drawId } = await params;
  if (!isUuid(drawId)) return { title: "Draw not found" };
  const result = await getPublicDraw(drawId);
  if (result.status !== "ok") return { title: "Draw not found" };

  const { draw } = result;
  const title = `${draw.title} · ${draw.organization.name}`;
  const description = draw.description ?? `Watch the ${draw.title} raffle draw on Raffle Angel.`;
  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    robots: { index: false, follow: false }, // shared by link, not listed in search engines
  };
}

export default async function PublicDrawPage({ params }: Props) {
  const { drawId } = await params;
  if (!isUuid(drawId)) notFound();

  const result = await getPublicDraw(drawId);
  if (result.status === "not_found") notFound();
  if (result.status === "error") throw new Error("Could not load the draw");

  return <LiveDraw drawId={drawId} initial={result.draw} />;
}