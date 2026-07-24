import { NextResponse } from "next/server";
import { convertAmount } from "@/lib/fx/convert";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const amountStr = searchParams.get("amount");

  if (!from || !to || !amountStr) {
    return NextResponse.json(
      { error: "Parâmetros obrigatórios: from, to, amount" },
      { status: 400 },
    );
  }

  const amount = parseFloat(amountStr);
  if (Number.isNaN(amount)) {
    return NextResponse.json({ error: "amount inválido" }, { status: 400 });
  }

  const result = await convertAmount(amount, from, to);

  return NextResponse.json(
    { from, to, amount, converted: result },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  );
}
