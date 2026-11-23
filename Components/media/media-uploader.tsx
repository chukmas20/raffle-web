"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { registerMediaAction, requestUploadAction } from "@/actions/media";
import { Alert } from "@/Components/ui/alert";
import { SelectField, TextField } from "@/Components/ui/field";
import {
  KIND_ALLOWS,
  KIND_LABELS,
  LIMITS_TEXT,
  MAX_SIZE,
  detectContentType,
  formatBytes,
  mediaClassOf,
} from "@/lib/media-types";
import type { MediaKind } from "@/types/api";

const KIND_HINTS: Record<MediaKind, string> = {
  music: "Plays in the background on the public page. Visitors tap “Turn on music”.",
  audio: "Shown in a “Listen” section with a player.",
  video: "Shown in a “Videos” section with a player.",
  advert: "An image or video in the rotating advert banner.",
};

function uploadToCloudinary(
  url: string,
  fields: Record<string, string>,
  file: File,
  onProgress: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    Object.entries(fields).forEach(([key, value]) => form.append(key, value));
    form.append("file", file); // must be the last field

    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return resolve();
      let message = "The upload was rejected.";
      try {
        message = JSON.parse(xhr.responseText).error?.message ?? message;
      } catch {
        // keep the default message
      }
      reject(new Error(message));
    };
    xhr.onerror = () => reject(new Error("Network error during the upload."));
    xhr.send(form);
  });
}

export function MediaUploader({
  orgId,
  drawId,
  categories,
}: {
  orgId: string;
  drawId: string;
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [kind, setKind] = useState<MediaKind>("music");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [feedback, setFeedback] = useState<{ tone: "error" | "notice"; text: string } | null>(null);

  const fail = (text: string) => setFeedback({ tone: "error", text });

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const form = new FormData(event.currentTarget);
    const categoryId = String(form.get("categoryId") ?? "");
    const typedTitle = String(form.get("title") ?? "").trim();

    if (!file) return fail("Choose a file to upload.");
    const contentType = detectContentType(file);
    if (!contentType) return fail("That file type isn't supported. Use MP3, M4A, AAC, WAV, OGG, MP4, WEBM, MOV, JPG, PNG or WEBP.");
    const mediaClass = mediaClassOf(contentType);
    if (!KIND_ALLOWS[kind].includes(mediaClass)) {
      return fail(`A ${mediaClass} file can't be used as “${KIND_LABELS[kind]}”.`);
    }
    if (file.size > MAX_SIZE[mediaClass]) {
      return fail(`That ${mediaClass} file is ${formatBytes(file.size)}. The limit is ${formatBytes(MAX_SIZE[mediaClass])}.`);
    }

    setBusy(true);
    setProgress(0);
    setFeedback(null);
    try {
      const presign = await requestUploadAction(orgId, drawId, {
        kind,
        contentType,
        sizeBytes: file.size,
      });
      if (!presign.ok) throw new Error(presign.message);
      const { ticket } = presign;

      if (new URL(ticket.upload_url).hostname !== "api.cloudinary.com") {
        throw new Error("Unexpected upload address. Please contact support.");
      }
      await uploadToCloudinary(ticket.upload_url, ticket.fields, file, setProgress);

      const saved = await registerMediaAction(orgId, drawId, {
        publicId: ticket.public_id,
        resourceType: ticket.resource_type,
        kind,
        title: typedTitle || file.name.replace(/\.[^.]+$/, ""),
        categoryId,
      });
      if (!saved.ok) throw new Error(saved.message);

      formRef.current?.reset();
      setFile(null);
      setFeedback({ tone: "notice", text: "Uploaded." });
      router.refresh();
    } catch (error) {
      fail(error instanceof Error ? error.message : "The upload failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-5 rounded-2xl border border-navy-100 bg-white p-6">
      <div>
        <h2 className="font-display text-lg font-bold text-navy-900">Upload media</h2>
        <p className="mt-1 text-sm text-navy-500">{LIMITS_TEXT}</p>
      </div>

      {feedback && <Alert tone={feedback.tone}>{feedback.text}</Alert>}

      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField
          label="What is it?"
          name="kind"
          value={kind}
          onChange={(event) => setKind(event.target.value as MediaKind)}
          hint={KIND_HINTS[kind]}
        >
          {(Object.keys(KIND_LABELS) as MediaKind[]).map((value) => (
            <option key={value} value={value}>
              {KIND_LABELS[value]}
            </option>
          ))}
        </SelectField>

        <SelectField
          label="Attach to a prize (optional)"
          name="categoryId"
          defaultValue=""
          hint="An image attached to a prize appears on that prize's card, like a photo of the car."
        >
          <option value="">None</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </SelectField>
      </div>

      <TextField label="Title (optional)" name="title" maxLength={150} placeholder="Opening theme" />

      <div>
        <label htmlFor="media-file" className="mb-1.5 block text-sm font-semibold text-navy-800">
          File
        </label>
        <input
          id="media-file"
          type="file"
          accept=".mp3,.m4a,.aac,.wav,.ogg,.mp4,.webm,.mov,.jpg,.jpeg,.png,.webp,audio/*,video/*,image/*"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          className="block w-full rounded-xl border border-navy-200 bg-white text-sm text-navy-700 file:mr-4 file:cursor-pointer file:border-0 file:bg-navy-900 file:px-4 file:py-3 file:font-semibold file:text-white hover:file:bg-navy-800"
        />
        {file && <p className="mt-1.5 text-sm text-navy-500">{file.name} · {formatBytes(file.size)}</p>}
      </div>

      {busy && (
        <div>
          <div
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-2 overflow-hidden rounded-full bg-navy-100"
          >
            <div className="h-full bg-crimson-600 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-1.5 text-sm text-navy-500">
            {progress < 100 ? `Uploading… ${progress}%` : "Finishing up…"}
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={busy}
        className="rounded-xl bg-crimson-600 px-6 py-3 text-[15px] font-semibold text-white shadow-lg shadow-crimson-600/20 transition hover:bg-crimson-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {busy ? "Uploading…" : "Upload"}
      </button>
    </form>
  );
}