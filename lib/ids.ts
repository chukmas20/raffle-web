import { notFound } from "next/navigation";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isUuid = (value: string) => UUID.test(value);

/** Rejects anything that isn't a UUID before it is used in an API path. */
export function assertUuid(...values: string[]) {
  for (const value of values) if (!isUuid(value)) notFound();
}