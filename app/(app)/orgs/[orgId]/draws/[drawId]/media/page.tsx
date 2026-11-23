import type { Metadata } from "next";
import { deleteMediaAction, updateMediaAction } from "@/actions/media";
import { MediaPreview } from "@/Components/media/media-preview";
import { MediaUploader } from "@/Components/media/media-uploader";
import { ActionForm } from "@/Components/ui/action-form";
import { Badge } from "@/Components/ui/badge";
import { Breadcrumbs } from "@/Components/ui/breadcrumbs";
import { SelectField, TextField } from "@/Components/ui/field";
import { authApi } from "@/lib/dal";
import { assertUuid } from "@/lib/ids";
import { KIND_LABELS, formatBytes } from "@/lib/media-types";
import type { Draw, DrawMedia, Organization } from "@/types/api";

export const metadata: Metadata = { title: "Media" };

export default async function MediaPage({
  params,
}: {
  params: Promise<{ orgId: string; drawId: string }>;
}) {
  const { orgId, drawId } = await params;
  assertUuid(orgId, drawId);
  const base = `/orgs/${orgId}/draws/${drawId}`;

  const [org, draw, media] = await Promise.all([
    authApi<Organization>(`/orgs/${orgId}`),
    authApi<Draw>(base),
    authApi<DrawMedia[]>(`${base}/media`),
  ]);

  const canEdit = draw.status !== "cancelled";
  const prizeName = new Map(draw.categories.map((c) => [c.id, c.name]));

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: org.name, href: `/orgs/${orgId}` },
          { label: draw.title, href: base },
          { label: "Media" },
        ]}
      />

      <h1 className="font-display text-3xl font-bold tracking-tight text-navy-900">Media</h1>
      <p className="mb-6 mt-2 max-w-2xl text-navy-600">
        Music, adverts, videos and audio for the public draw page. Files go straight to Cloudinary and appear on the page within seconds.
      </p>

      {canEdit && (
        <MediaUploader
          orgId={orgId}
          drawId={drawId}
          categories={draw.categories.map((c) => ({ id: c.id, name: c.name }))}
        />
      )}

      <h2 className="mb-4 mt-10 font-display text-xl font-bold text-navy-900">
        Uploaded files ({media.length})
      </h2>

      {media.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-navy-200 bg-white/60 p-8 text-center text-sm text-navy-500">
          Nothing uploaded yet.
        </p>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {media.map((item) => (
            <article key={item.id} className="rounded-2xl border border-navy-100 bg-white p-4">
              <MediaPreview item={item} />
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-navy-900">{item.title}</h3>
                <Badge tone="dark">{KIND_LABELS[item.kind]}</Badge>
                {item.category_id && prizeName.get(item.category_id) && (
                  <Badge tone="crimson">{prizeName.get(item.category_id)}</Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-navy-500">
                {item.format.toUpperCase()} · {formatBytes(item.size_bytes)} · Order {item.sort_order}
              </p>

              {canEdit && (
                <div className="mt-4 flex flex-wrap items-start gap-3">
                  <details className="w-full">
                    <summary className="cursor-pointer text-sm font-semibold text-crimson-600">Edit</summary>
                    <ActionForm
                      action={updateMediaAction.bind(null, orgId, drawId, item.id)}
                      label="Save"
                      size="sm"
                      className="mt-3 space-y-3"
                    >
                      <TextField label="Title" name="title" defaultValue={item.title} maxLength={150} />
                      <SelectField label="Prize" name="categoryId" defaultValue={item.category_id ?? ""}>
                        <option value="">None</option>
                        {draw.categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </SelectField>
                      <TextField
                        label="Order"
                        name="sortOrder"
                        type="number"
                        min={0}
                        defaultValue={String(item.sort_order)}
                        hint="Lower numbers come first."
                      />
                    </ActionForm>
                  </details>

                  <ActionForm
                    action={deleteMediaAction.bind(null, orgId, drawId, item.id)}
                    label="Delete"
                    variant="danger"
                    size="sm"
                    confirm={`Delete “${item.title}”? It is removed from the public page too.`}
                  />
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </>
  );
}