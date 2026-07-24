import { NextResponse } from "next/server";
import { searchCities } from "@/lib/geo/cities";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const countryCode = searchParams.get("countryCode");
  const q = searchParams.get("q") ?? "";

  if (!countryCode) {
    return NextResponse.json(
      { error: "Parâmetro obrigatório: countryCode" },
      { status: 400 },
    );
  }

  const cities = await searchCities(countryCode, q);

  return NextResponse.json(
    { cities },
    {
      headers: {
        "Cache-Control":
          "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    },
  );
}
