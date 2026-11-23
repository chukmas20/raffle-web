"use server";

import { revalidatePath } from "next/cache";
import { mutate, text } from "@/lib/action-utils";
import { isUuid } from "@/lib/ids";
import type { MediaKind } from "@/types/api";
import type { FormState } from "@/types/forms";

const KINDS: MediaKind[] = ["music", "audio", "video", "advert"];
const mediaPath = (orgId: string, drawId: string) => `/orgs/${orgId}/draws/${drawId}/media`;

export type UploadTicket = {
  upload_url: string;
  public_id: string;
  resource_type: "image" | "video";
  fields: Record<string, string>;
  max_size_bytes: number;
};

type Failure = { ok: false; message: string };

export async function requestUploadAction(
  orgId: string,
  drawId: string,
  input: { kind: string; contentType: string; sizeBytes: number },
): Promise<{ ok: true; ticket: UploadTicket } | Failure> {
  if (!isUuid(orgId) || !isUuid(drawId)) return { ok: false, message: "Draw not found." };
  if (
    !KINDS.includes(input.kind as MediaKind) ||
    typeof input.contentType !== "string" ||
    !Number.isInteger(input.sizeBytes) ||
    input.sizeBytes < 1
  ) {
    return { ok: false, message: "Invalid upload request." };
  }

  const result = await mutate<UploadTicket>(`${mediaPath(orgId, drawId)}/upload-url`, "POST", {
    kind: input.kind,
    content_type: input.contentType,
    size_bytes: input.sizeBytes,
  });
  if (result.error) return { ok: false, message: result.error.message ?? "Could not start the upload." };
  return { ok: true, ticket: result.data };
}

export async function registerMediaAction(
  orgId: string,
  drawId: string,
  input: { publicId: string; resourceType: string; kind: string; title: string; categoryId: string },
): Promise<{ ok: true } | Failure> {
  if (!isUuid(orgId) || !isUuid(drawId)) return { ok: false, message: "Draw not found." };
  const title = String(input.title ?? "").trim();
  if (
    !KINDS.includes(input.kind as MediaKind) ||
    !["image", "video"].includes(input.resourceType) ||
    typeof input.publicId !== "string" ||
    title.length < 1 ||
    title.length > 150 ||
    (input.categoryId !== "" && !isUuid(input.categoryId))
  ) {
    return { ok: false, message: "Invalid media details." };
  }

  const result = await mutate(mediaPath(orgId, drawId), "POST", {
    public_id: input.publicId,
    resource_type: input.resourceType,
    kind: input.kind,
    title,
    category_id: input.categoryId || null,
  });
  if (result.error) return { ok: false, message: result.error.message ?? "Could not save the file." };

  revalidatePath(mediaPath(orgId, drawId));
  return { ok: true };
}

export async function updateMediaAction(
  orgId: string,
  drawId: string,
  mediaId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const title = text(formData, "title");
  const categoryId = text(formData, "categoryId");
  const sortOrder = Number(text(formData, "sortOrder") || "0");
  if (!title) return { message: "Give the file a title." };
  if (!Number.isInteger(sortOrder) || sortOrder < 0) return { message: "Order must be 0 or more." };
  if (categoryId && !isUuid(categoryId)) return { message: "Choose a valid prize." };

  const result = await mutate(`${mediaPath(orgId, drawId)}/${mediaId}`, "PATCH", {
    title,
    category_id: categoryId || null,
    sort_order: sortOrder,
  });
  if (result.error) return result.error;
  revalidatePath(mediaPath(orgId, drawId));
  return { ok: true, message: "Saved." };
}

export async function deleteMediaAction(
  orgId: string,
  drawId: string,
  mediaId: string,
): Promise<FormState> {
  const result = await mutate(`${mediaPath(orgId, drawId)}/${mediaId}`, "DELETE");
  if (result.error) return result.error;
  revalidatePath(mediaPath(orgId, drawId));
  return { ok: true };
}