import type { Leg } from "@/lib/validation/trip.schema";

export type TripStatus = "upcoming" | "active" | "past";

/**
 * Computa o status da viagem a partir das datas das pernas (§6.1 do SDD).
 * Nunca persiste — sempre calculado em runtime.
 */
export function computeTripStatus(legs: Leg[]): TripStatus {
  if (legs.length === 0) return "upcoming";

  const sorted = [...legs].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
  );

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const first = new Date(sorted[0].startDate);
  first.setUTCHours(0, 0, 0, 0);

  const last = new Date(sorted[sorted.length - 1].endDate);
  last.setUTCHours(0, 0, 0, 0);

  if (today < first) return "upcoming";
  if (today > last) return "past";
  return "active";
}
