"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { mutate, text } from "@/lib/action-utils";
import { fieldErrorsFrom, drawSchema } from "@/lib/validation";
import type { Draw, DrawResult } from "@/types/api";
import type { FormState } from "@/types/forms";

const drawPath = (orgId: string, drawId: string) => `/orgs/${orgId}/draws/${drawId}`;

function refresh(orgId: string, drawId: string) {
  revalidatePath(drawPath(orgId, drawId), "layout");
}

export async function createDrawAction(
  orgId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const names = formData.getAll("categoryName").map(String);
  const prizes = formData.getAll("categoryPrize").map(String);
  const winners = formData.getAll("categoryWinners").map(String);
  const rows = names
    .map((name, i) => ({ name, prize: prizes[i] ?? "", winners: winners[i] || "1" }))
    .filter((row) => row.name.trim() !== "" || row.prize.trim() !== "");

  const values = {
    title: text(formData, "title"),
    description: text(formData, "description"),
    scheduledAt: text(formData, "scheduledAt"),
    ticketDigits: text(formData, "ticketDigits") || "4",
    soldOnly: formData.get("soldOnly") ? "on" : "off",
    excludeWinners: formData.get("excludeWinners") ? "on" : "off",
    categories: JSON.stringify(rows),
  };

  const parsed = drawSchema.safeParse({
    title: values.title,
    description: values.description,
    scheduledAt: values.scheduledAt,
    ticketDigits: values.ticketDigits,
    categories: rows,
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error), values };

  const data = parsed.data;
  const result = await mutate<Draw>(`/orgs/${orgId}/draws`, "POST", {
    title: data.title,
    description: data.description || null,
    // The form time is Nigerian time (WAT, UTC+1, no daylight saving).
    scheduled_at: data.scheduledAt ? new Date(`${data.scheduledAt}:00+01:00`).toISOString() : null,
    ticket_digits: data.ticketDigits,
    draw_from_sold_only: values.soldOnly === "on",
    exclude_previous_winners: values.excludeWinners === "on",
    categories: data.categories.map((c) => ({
      name: c.name,
      prize_description: c.prize || null,
      winners_count: c.winners,
    })),
  });
  if (result.error) return { ...result.error, values };

  revalidatePath(`/orgs/${orgId}`);
  redirect(drawPath(orgId, result.data.id));
}

export async function activateDrawAction(orgId: string, drawId: string): Promise<FormState> {
  const result = await mutate(`${drawPath(orgId, drawId)}/activate`, "POST");
  if (result.error) return result.error;
  refresh(orgId, drawId);
  return { ok: true, message: "The draw is now live." };
}

export async function cancelDrawAction(orgId: string, drawId: string): Promise<FormState> {
  const result = await mutate(`${drawPath(orgId, drawId)}/cancel`, "POST");
  if (result.error) return result.error;
  refresh(orgId, drawId);
  return { ok: true };
}

export async function addCategoryAction(
  orgId: string,
  drawId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const name = text(formData, "name");
  const winners = Number(text(formData, "winners") || "1");
  if (!name) return { message: "Enter a name for the prize." };
  if (!Number.isInteger(winners) || winners < 1 || winners > 1000) {
    return { message: "Winners must be a number between 1 and 1,000." };
  }
  const result = await mutate(`${drawPath(orgId, drawId)}/categories`, "POST", {
    name,
    prize_description: text(formData, "prize") || null,
    winners_count: winners,
  });
  if (result.error) return result.error;
  refresh(orgId, drawId);
  return { ok: true, message: "Prize added." };
}

export async function deleteCategoryAction(
  orgId: string,
  drawId: string,
  categoryId: string,
): Promise<FormState> {
  const result = await mutate(`${drawPath(orgId, drawId)}/categories/${categoryId}`, "DELETE");
  if (result.error) return result.error;
  refresh(orgId, drawId);
  return { ok: true };
}

export async function generateTicketsAction(
  orgId: string,
  drawId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const count = Number(text(formData, "count"));
  const mode = text(formData, "mode") === "sequential" ? "sequential" : "random";
  if (!Number.isInteger(count) || count < 1 || count > 100_000) {
    return { message: "Enter a number of tickets between 1 and 100,000." };
  }
  const result = await mutate<{ generated: number; total_tickets: number }>(
    `${drawPath(orgId, drawId)}/tickets/generate`,
    "POST",
    { count, mode },
  );
  if (result.error) return result.error;
  refresh(orgId, drawId);
  return {
    ok: true,
    message: `Generated ${result.data.generated.toLocaleString("en-NG")} tickets. The draw now has ${result.data.total_tickets.toLocaleString("en-NG")}.`,
  };
}

export async function markSoldAction(
  orgId: string,
  drawId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const numbers = text(formData, "numbers").split(/[\s,;]+/).filter(Boolean);
  const rangeFrom = text(formData, "rangeFrom");
  const rangeTo = text(formData, "rangeTo");
  const hasRange = rangeFrom !== "" || rangeTo !== "";

  if (numbers.length && hasRange) {
    return { message: "Use either a list of numbers or a range, not both." };
  }
  if (!numbers.length && !(rangeFrom && rangeTo)) {
    return { message: "Enter a range (from and to) or a list of ticket numbers." };
  }
  if (numbers.length > 5000) return { message: "You can mark at most 5,000 numbers at once." };

  const result = await mutate<{ updated: number }>(
    `${drawPath(orgId, drawId)}/tickets/mark-sold`,
    "POST",
    numbers.length ? { numbers } : { range_from: rangeFrom, range_to: rangeTo },
  );
  if (result.error) return result.error;
  refresh(orgId, drawId);
  return {
    ok: true,
    message:
      result.data.updated > 0
        ? `${result.data.updated.toLocaleString("en-NG")} tickets marked as sold.`
        : "No available tickets matched. They may already be sold.",
  };
}

export async function updateTicketAction(
  orgId: string,
  drawId: string,
  ticketId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const body: Record<string, unknown> = {
    holder_name: text(formData, "holderName") || null,
    holder_phone: text(formData, "holderPhone") || null,
    holder_email: text(formData, "holderEmail") || null,
  };
  const status = text(formData, "status");
  if (status) body.status = status;

  const result = await mutate(`${drawPath(orgId, drawId)}/tickets/${ticketId}`, "PATCH", body);
  if (result.error) return result.error;
  refresh(orgId, drawId);
  return { ok: true, message: "Saved." };
}

export async function runCategoryAction(
  orgId: string,
  drawId: string,
  categoryId: string,
): Promise<FormState> {
  const result = await mutate(`${drawPath(orgId, drawId)}/categories/${categoryId}/run`, "POST");
  if (result.error) return result.error;
  refresh(orgId, drawId);
  return { ok: true };
}

export async function voidRedrawAction(
  orgId: string,
  drawId: string,
  resultId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const reason = text(formData, "reason");
  if (reason.length < 3) return { message: "Give a short reason (at least 3 characters)." };
  const result = await mutate<DrawResult>(
    `${drawPath(orgId, drawId)}/results/${resultId}/void-and-redraw`,
    "POST",
    { reason },
  );
  if (result.error) return result.error;
  refresh(orgId, drawId);
  return { ok: true };
}