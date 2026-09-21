import { NextRequest, NextResponse } from "next/server";

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function GET(request: NextRequest) {
  const symbol =
    request.nextUrl.searchParams.get("symbol")?.trim() ?? "";

  const exchange =
    request.nextUrl.searchParams.get("exchange")?.trim() ?? "";

  if (!symbol) {
    return NextResponse.json(
      { error: "Symbol fehlt." },
      { status: 400 }
    );
  }

  const apiKey = process.env.TWELVE_DATA_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "TWELVE_DATA_API_KEY fehlt." },
      { status: 500 }
    );
  }

  const quoteParams = new URLSearchParams({
    symbol,
    apikey: apiKey,
    dp: "6",
  });

  if (exchange) {
    quoteParams.set("exchange", exchange);
  }

  const now = new Date();

  const monthAgo = new Date(now);
  monthAgo.setUTCDate(monthAgo.getUTCDate() - 31);

  const monthParams = new URLSearchParams({
    symbol,
    interval: "1day",
    start_date: formatDate(monthAgo),
    end_date: formatDate(now),
    order: "asc",
    apikey: apiKey,
  });

  if (exchange) {
    monthParams.set("exchange", exchange);
  }

  try {
    const [quoteResponse, monthResponse] =
      await Promise.all([
        fetch(
          `https://api.twelvedata.com/quote?${quoteParams.toString()}`,
          {
            next: {
              revalidate: 15,
            },
          }
        ),

        fetch(
          `https://api.twelvedata.com/time_series?${monthParams.toString()}`,
          {
            next: {
              revalidate: 300,
            },
          }
        ),
      ]);

    const quote = await quoteResponse.json();
    const monthData = await monthResponse.json();

    if (quote.status === "error") {
      return NextResponse.json(
        {
          error:
            quote.message ??
            "Kursdaten konnten nicht geladen werden.",
        },
        { status: 400 }
      );
    }

    const monthValues = Array.isArray(monthData.values)
      ? monthData.values
      : [];

    const highs = monthValues
      .map((item: { high?: string }) =>
        Number(item.high)
      )
      .filter(Number.isFinite);

    const lows = monthValues
      .map((item: { low?: string }) =>
        Number(item.low)
      )
      .filter(Number.isFinite);

    const monthHigh =
      highs.length > 0 ? Math.max(...highs) : null;

    const monthLow =
      lows.length > 0 ? Math.min(...lows) : null;

    return NextResponse.json({
      quote,
      month_high: monthHigh,
      month_low: monthLow,
    });
  } catch {
    return NextResponse.json(
      {
        error: "Marktdaten konnten nicht geladen werden.",
      },
      {
        status: 500,
      }
    );
  }
}