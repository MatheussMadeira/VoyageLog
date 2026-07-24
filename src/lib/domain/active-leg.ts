import type { Leg } from "@/lib/validation/trip.schema";

export interface ActiveLegResult {
  leg: Leg;
  index: number;
}

/**
 * Resolve a perna ativa a partir de uma data de referência (§6.2 do SDD).
 *
 * Regras:
 * 1. Leg direta: leg.startDate <= d <= leg.endDate → retorna essa leg.
 * 2. Gap (d entre duas legs): retorna a leg com endDate mais recente antes de d.
 * 3. Fora do itinerário (d < primeiro startDate ou d > último endDate): retorna null.
 */
export function resolveActiveLeg(
  legs: Leg[],
  referenceDate: Date,
): ActiveLegResult | null {
  if (legs.length === 0) return null;

  const sorted = [...legs]
    .map((leg, originalIndex) => ({ leg, originalIndex }))
    .sort(
      (a, b) =>
        new Date(a.leg.startDate).getTime() -
        new Date(b.leg.startDate).getTime(),
    );

  const d = referenceDate.getTime();

  const firstStart = new Date(sorted[0].leg.startDate).getTime();
  const lastEnd = new Date(sorted[sorted.length - 1].leg.endDate).getTime();

  // Fora do itinerário
  if (d < firstStart || d > lastEnd) return null;

  // Leg direta
  for (const { leg, originalIndex } of sorted) {
    const start = new Date(leg.startDate).getTime();
    const end = new Date(leg.endDate).getTime();
    if (d >= start && d <= end) {
      return { leg, index: originalIndex };
    }
  }

  // Gap case: retorna a leg com endDate mais recente antes de d
  let bestCandidate: { leg: Leg; originalIndex: number } | null = null;
  for (const { leg, originalIndex } of sorted) {
    const end = new Date(leg.endDate).getTime();
    if (end < d) {
      if (
        !bestCandidate ||
        end > new Date(bestCandidate.leg.endDate).getTime()
      ) {
        bestCandidate = { leg, originalIndex };
      }
    }
  }

  if (bestCandidate) {
    return { leg: bestCandidate.leg, index: bestCandidate.originalIndex };
  }

  return null;
}
