import { NextRequest, NextResponse } from "next/server";

const allowedRanges = [
  "1D",
  "5D",
  "1M",
  "3M",
  "6M",
  "YTD",
  "1Y",
  "3Y",
  "ALL",
] as const;

type Range =
  (typeof allowedRanges)[number];

function dateString(date: Date) {
  return date.toISOString().slice(0, 10);
}

function subtractDays(date: Date, days: number) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() - days);
  return result;
}

function subtractMonths(
  date: Date,
  months: number
) {
  const result = new Date(date);
  result.setUTCMonth(
    result.getUTCMonth() - months
  );
  return result;
}

function subtractYears(
  date: Date,
  years: number
) {
  const result = new Date(date);
  result.setUTCFullYear(
    result.getUTCFullYear() - years
  );
  return result;
}

export async function GET(
  request: NextRequest
) {
  const symbol =
    request.nextUrl.searchParams.get("symbol")?.trim() ??
    "";

  const exchange =
    request.nextUrl.searchParams
      .get("exchange")
      ?.trim() ?? "";

  const requestedRange =
    request.nextUrl.searchParams
      .get("range")
      ?.toUpperCase() ?? "1D";

  const range: Range =
    allowedRanges.includes(
      requestedRange as Range
    )
      ? (requestedRange as Range)
      : "1D";

  if (!symbol) {
    return NextResponse.json(
      { error: "Symbol fehlt." },
      { status: 400 }
    );
  }

  const apiKey =
    process.env.TWELVE_DATA_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Twelve Data API-Key fehlt." },
      { status: 500 }
    );
  }

  const now = new Date();

  const params = new URLSearchParams({
    symbol,
    apikey: apiKey,
    order: "asc",
  });

  if (exchange) {
    params.set("exchange", exchange);
  }

  switch (range) {
    case "1D":
      params.set("interval", "5min");
      params.set("outputsize", "200");
      params.set("timezone", "UTC");
      break;

    case "5D":
      params.set("interval", "15min");
      params.set("outputsize", "1000");
      params.set("timezone", "UTC");
      break;

    case "1M":
      params.set("interval", "1h");
      params.set(
        "start_date",
        dateString(subtractDays(now, 31))
      );
      params.set(
        "end_date",
        dateString(now)
      );
      params.set("timezone", "UTC");
      break;

    case "3M":
      params.set("interval", "1day");
      params.set(
        "start_date",
        dateString(subtractMonths(now, 3))
      );
      params.set(
        "end_date",
        dateString(now)
      );
      break;

    case "6M":
      params.set("interval", "1day");
      params.set(
        "start_date",
        dateString(subtractMonths(now, 6))
      );
      params.set(
        "end_date",
        dateString(now)
      );
      break;

    case "YTD": {
      params.set("interval", "1day");

      const firstDay =
        new Date(
          Date.UTC(
            now.getUTCFullYear(),
            0,
            1
          )
        );

      params.set(
        "start_date",
        dateString(firstDay)
      );

      params.set(
        "end_date",
        dateString(now)
      );

      break;
    }

    case "1Y":
      params.set("interval", "1day");
      params.set(
        "start_date",
        dateString(subtractYears(now, 1))
      );
      params.set(
        "end_date",
        dateString(now)
      );
      break;

    case "3Y":
      params.set("interval", "1week");
      params.set(
        "start_date",
        dateString(subtractYears(now, 3))
      );
      params.set(
        "end_date",
        dateString(now)
      );
      break;

    case "ALL":
      params.set("interval", "1month");
      params.set("outputsize", "5000");
      break;
  }

  try {
    const response = await fetch(
      `https://api.twelvedata.com/time_series?${params.toString()}`,
      {
        next: {
          revalidate: 60,
        },
      }
    );

    const result = await response.json();

    if (result.status === "error") {
      return NextResponse.json(
        {
          error:
            result.message ??
            "Chartdaten konnten nicht geladen werden.",
        },
        {
          status: 400,
        }
      );
    }

    let values = Array.isArray(result.values)
      ? result.values
      : [];

    /*
     * 1D = letzter verfügbarer Handelstag.
     */
    if (range === "1D" && values.length > 0) {
      const latest =
        values[values.length - 1].datetime;

      const latestDate =
        latest.slice(0, 10);

      values = values.filter(
        (item: { datetime: string }) =>
          item.datetime.slice(0, 10) ===
          latestDate
      );
    }

    /*
     * 5D = letzte fünf tatsächliche
     * Handelstage statt fünf Kalendertage.
     */
    if (range === "5D" && values.length > 0) {
      const dates: string[] = [];

      for (
        let i = values.length - 1;
        i >= 0;
        i--
      ) {
        const date =
          values[i].datetime.slice(0, 10);

        if (!dates.includes(date)) {
          dates.push(date);
        }

        if (dates.length === 5) {
          break;
        }
      }

      values = values.filter(
        (item: { datetime: string }) =>
          dates.includes(
            item.datetime.slice(0, 10)
          )
      );
    }

    return NextResponse.json({
      meta: result.meta ?? null,
      values,
      range,
    });
  } catch {
    return NextResponse.json(
      {
        error:
          "Chartdaten konnten nicht geladen werden.",
      },
      {
        status: 500,
      }
    );
  }
}