"use server";

import { mutate } from "@/lib/action-utils";
import { isUuid } from "@/lib/ids";
import type { DrawResult } from "@/types/api";
import type { MachineWinner, SpinOutcome } from "@/types/machine";

type DrawNextResponse = {
  result: DrawResult;
  drawn: number;
  total: number;
  category_completed: boolean;
  draw_completed: boolean;
};

// Only the ticket number and the (optional) name go to the browser, never phone numbers.
const toWinner = (result: DrawResult): MachineWinner => ({
  id: result.id,
  number: result.ticket_number,
  name: result.holder_name,
  position: result.position,
});

export async function drawNextWinnerAction(
  orgId: string,
  drawId: string,
  categoryId: string,
): Promise<SpinOutcome> {
  if (![orgId, drawId, categoryId].every((id) => isUuid(id))) {
    return { ok: false, message: "Invalid request." };
  }
  const result = await mutate<DrawNextResponse>(
    `/orgs/${orgId}/draws/${drawId}/categories/${categoryId}/draw-next`,
    "POST",
  );
  if (result.error) return { ok: false, message: result.error.message ?? "Could not draw a winner." };
  return {
    ok: true,
    winner: toWinner(result.data.result),
    drawn: result.data.drawn,
    total: result.data.total,
  };
}

export async function redrawWinnerAction(
  orgId: string,
  drawId: string,
  resultId: string,
): Promise<SpinOutcome> {
  if (![orgId, drawId, resultId].every((id) => isUuid(id))) {
    return { ok: false, message: "Invalid request." };
  }
  const result = await mutate<DrawResult>(
    `/orgs/${orgId}/draws/${drawId}/results/${resultId}/void-and-redraw`,
    "POST",
    { reason: "Winner not present" },
  );
  if (result.error) return { ok: false, message: result.error.message ?? "Could not redraw." };
  return { ok: true, winner: toWinner(result.data), drawn: 0, total: 0 };
}