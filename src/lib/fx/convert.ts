import { getMongoose } from "@/lib/db/client";
import { getRateCacheModel } from "@/lib/db/collections";

const TTL_MS = 12 * 60 * 60 * 1000; // 12 horas

export function normalizeRates(
  payload: Record<string, unknown> | null | undefined,
): Record<string, Record<string, number>> | null {
  if (!payload || typeof payload !== "object") return null;

  const ratesObject =
    payload.rates && typeof payload.rates === "object"
      ? (payload.rates as Record<string, unknown>)
      : payload;

  const entries = Object.entries(ratesObject).filter(
    ([key]) =>
      ![
        "date",
        "result",
        "provider",
        "documentation",
        "terms_of_use",
        "time_last_update_unix",
        "time_last_update_utc",
        "time_next_update_unix",
        "time_next_update_utc",
        "time_eol_unix",
        "base_code",
      ].includes(key),
  );

  const normalized: Record<string, Record<string, number>> = {};

  for (const [base, value] of entries) {
    if (!value || typeof value !== "object") continue;

    const rates: Record<string, number> = {};
    for (const [currency, rate] of Object.entries(
      value as Record<string, unknown>,
    )) {
      if (typeof rate === "number") {
        rates[currency.toUpperCase()] = rate;
      }
    }

    if (Object.keys(rates).length > 0) {
      normalized[base.toUpperCase()] = rates;
    }
  }

  if (normalized["USD"] && Object.keys(normalized["USD"]).length > 0) {
    return normalized;
  }

  const directRates: Record<string, number> = {};
  for (const [currency, rate] of Object.entries(ratesObject)) {
    if (typeof rate === "number") {
      directRates[currency.toUpperCase()] = rate;
    }
  }

  if (Object.keys(directRates).length > 0) {
    return {
      [payload.base_code?.toString().toUpperCase() ?? "USD"]: directRates,
    };
  }

  return Object.keys(normalized).length > 0 ? normalized : null;
}

async function fetchFromExchangeRateApi(
  base: string,
): Promise<Record<string, number> | null> {
  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${base}`, {
      next: { revalidate: 0 },
    });
    if (!res.ok) {
      console.error(
        "[FX] exchangerate-api não-ok:",
        res.status,
        await res.text(),
      );
      return null;
    }
    const data = await res.json();
    const normalized = normalizeRates(data);
    const result = normalized?.[base.toUpperCase()] ?? null;
    if (!result)
      console.error(
        "[FX] exchangerate-api normalizou vazio:",
        JSON.stringify(data).slice(0, 300),
      );
    return result;
  } catch (err) {
    console.error("[FX] exchangerate-api throw:", err);
    return null;
  }
}

async function fetchFromFrankfurter(
  base: string,
): Promise<Record<string, number> | null> {
  try {
    const res = await fetch(`https://api.frankfurter.app/latest?from=${base}`, {
      next: { revalidate: 0 },
    });
    if (!res.ok) {
      console.error(
        "[FX] exchangerate-api não-ok:",
        res.status,
        await res.text(),
      );
      return null;
    }
    const data = await res.json();
    const normalized = normalizeRates(data);
    const result = normalized?.[base.toUpperCase()] ?? null;
    if (!result)
      console.error(
        "[FX] exchangerate-api normalizou vazio:",
        JSON.stringify(data).slice(0, 300),
      );
    return result;
  } catch (err) {
    console.error("[FX] exchangerate-api throw:", err);
    return null;
  }
}

async function fetchFromCdnFallback(
  base: string,
): Promise<Record<string, number> | null> {
  try {
    const res = await fetch(
      `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${base.toLowerCase()}.json`,
      { next: { revalidate: 0 } },
    );
    if (!res.ok) {
      console.error(
        "[FX] exchangerate-api não-ok:",
        res.status,
        await res.text(),
      );
      return null;
    }
    const data = await res.json();
    const normalized = normalizeRates(data);
    const result = normalized?.[base.toUpperCase()] ?? null;
    if (!result)
      console.error(
        "[FX] exchangerate-api normalizou vazio:",
        JSON.stringify(data).slice(0, 300),
      );
    return result;
  } catch (err) {
    console.error("[FX] exchangerate-api throw:", err);
    return null;
  }
}

export async function getRates(
  base: string,
): Promise<Record<string, number> | null> {
  await getMongoose();
  const RateCacheModel = getRateCacheModel();

  const cached = await RateCacheModel.findOne({ base: base.toUpperCase() });
  if (cached) {
    const age = Date.now() - new Date(cached.fetchedAt).getTime();
    if (age < TTL_MS) {
      const ratesObj =
        cached.rates instanceof Map
          ? Object.fromEntries(cached.rates)
          : (cached.rates as Record<string, number>);
      return ratesObj;
    }
  }

  const rates =
    (await fetchFromExchangeRateApi(base)) ??
    (await fetchFromFrankfurter(base)) ??
    (await fetchFromCdnFallback(base));

  if (rates) {
    await RateCacheModel.findOneAndUpdate(
      { base: base.toUpperCase() },
      { base: base.toUpperCase(), rates, fetchedAt: new Date() },
      { upsert: true },
    );
  }

  return rates;
}

/**
 * Converte um valor de uma moeda para outra.
 * Retorna null se os provedores estiverem indisponíveis (nunca bloqueia o save da despesa).
 */
export async function convertAmount(
  amount: number,
  from: string,
  to: string,
): Promise<number | null> {
  if (from.toUpperCase() === to.toUpperCase()) return amount;

  const rates = await getRates(from.toUpperCase());
  if (!rates) return null;

  const rate = rates[to.toUpperCase()];
  if (!rate) return null;

  return Math.round(amount * rate * 100) / 100;
}
