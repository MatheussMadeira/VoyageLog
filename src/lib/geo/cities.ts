import { getCountryByCode } from "@/lib/data/countries";

const GEODB_HOST = "wft-geo-db.p.rapidapi.com";

async function fetchFromGeoDB(
  countryCode: string,
  query: string,
): Promise<string[] | null> {
  const key = process.env.GEODB_API_KEY;
  if (!key) return null;

  try {
    const url = new URL(`https://${GEODB_HOST}/v1/geo/cities`);
    url.searchParams.set("countryIds", `Q${countryCode}`);
    url.searchParams.set("minPopulation", "40000");
    url.searchParams.set("namePrefix", query);
    url.searchParams.set("limit", "10");
    url.searchParams.set("sort", "-population");

    const res = await fetch(url.toString(), {
      headers: {
        "x-rapidapi-host": GEODB_HOST,
        "x-rapidapi-key": key,
      },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return (data.data as Array<{ name: string }>)?.map((c) => c.name) ?? null;
  } catch {
    return null;
  }
}

async function fetchFromCountriesNow(
  countryCode: string,
): Promise<string[] | null> {
  try {
    const country = getCountryByCode(countryCode);
    if (!country) return null;

    const res = await fetch(
      "https://countriesnow.space/api/v0.1/countries/cities",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country: country.name }),
        next: { revalidate: 86400 },
      },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return (data.data as string[]) ?? null;
  } catch {
    return null;
  }
}

/**
 * Retorna lista de cidades para um país dado o código ISO e um termo de busca.
 * Tenta GeoDB primeiro; cai para CountriesNow se falhar.
 */
export async function searchCities(
  countryCode: string,
  query: string,
): Promise<string[]> {
  const fromGeoDB = await fetchFromGeoDB(countryCode, query);
  if (fromGeoDB) return fromGeoDB;

  const fromCountriesNow = await fetchFromCountriesNow(countryCode);
  if (fromCountriesNow) {
    const q = query.toLowerCase();
    return fromCountriesNow
      .filter((c) => c.toLowerCase().includes(q))
      .slice(0, 10);
  }

  return [];
}
