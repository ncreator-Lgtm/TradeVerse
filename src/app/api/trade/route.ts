import {
  NextRequest,
  NextResponse,
} from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type TradeSide = "buy" | "sell";

async function getQuote({
  symbol,
  exchange,
  apiKey,
}: {
  symbol: string;
  exchange?: string;
  apiKey: string;
}) {
  const params = new URLSearchParams({
    symbol,
    apikey: apiKey,
    dp: "8",
  });

  if (exchange) {
    params.set("exchange", exchange);
  }

  const response = await fetch(
    `https://api.twelvedata.com/quote?${params.toString()}`,
    {
      cache: "no-store",
    }
  );

  const quote = await response.json();

  if (
    !response.ok ||
    quote.status === "error"
  ) {
    throw new Error(
      quote.message ??
        "Marktkurs konnte nicht geladen werden."
    );
  }

  return quote;
}

async function getFxRateToEur({
  currency,
  apiKey,
}: {
  currency: string;
  apiKey: string;
}) {
  if (
    currency.toUpperCase() === "EUR"
  ) {
    return 1;
  }

  const params = new URLSearchParams({
    symbol: `${currency.toUpperCase()}/EUR`,
    apikey: apiKey,
  });

  const response = await fetch(
    `https://api.twelvedata.com/exchange_rate?${params.toString()}`,
    {
      cache: "no-store",
    }
  );

  const result = await response.json();

  const rate = Number(result.rate);

  if (
    !response.ok ||
    result.status === "error" ||
    !Number.isFinite(rate) ||
    rate <= 0
  ) {
    throw new Error(
      "Wechselkurs konnte nicht geladen werden."
    );
  }

  return rate;
}

/*
 * Cash + aktuelle Position für die Trading-Box.
 */
export async function GET(
  request: NextRequest
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      {
        error: "Nicht angemeldet.",
      },
      {
        status: 401,
      }
    );
  }

  const symbol =
    request.nextUrl.searchParams
      .get("symbol")
      ?.trim() ?? "";

  const exchange =
    request.nextUrl.searchParams
      .get("exchange")
      ?.trim() ?? "";

  if (!symbol) {
    return NextResponse.json(
      {
        error: "Symbol fehlt.",
      },
      {
        status: 400,
      }
    );
  }

  const {
    data: portfolio,
    error: portfolioError,
  } = await supabase
    .from("personal_portfolios")
    .select(
      "id, cash_balance, starting_capital"
    )
    .eq("user_id", user.id)
    .single();

  if (portfolioError || !portfolio) {
    return NextResponse.json(
      {
        error:
          "Portfolio konnte nicht geladen werden.",
      },
      {
        status: 500,
      }
    );
  }

  let positionQuery = supabase
    .from("personal_positions")
    .select(
      "id, symbol, exchange, instrument_name, currency, quantity, average_cost_native, average_cost_eur"
    )
    .eq("user_id", user.id)
    .eq("symbol", symbol);

  if (exchange) {
    positionQuery =
      positionQuery.eq(
        "exchange",
        exchange
      );
  } else {
    positionQuery =
      positionQuery.is(
        "exchange",
        null
      );
  }

  const {
    data: position,
    error: positionError,
  } =
    await positionQuery.maybeSingle();

  if (positionError) {
    return NextResponse.json(
      {
        error:
          "Position konnte nicht geladen werden.",
      },
      {
        status: 500,
      }
    );
  }

  return NextResponse.json({
    cash_balance:
      portfolio.cash_balance,

    starting_capital:
      portfolio.starting_capital,

    position:
      position ?? null,
  });
}

/*
 * Kaufen / Verkaufen.
 */
export async function POST(
  request: NextRequest
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      {
        error: "Nicht angemeldet.",
      },
      {
        status: 401,
      }
    );
  }

  const body = await request.json();

  const symbol =
    String(
      body.symbol ?? ""
    )
      .trim()
      .toUpperCase();

  const exchange =
    String(
      body.exchange ?? ""
    ).trim();

  const requestedName =
    String(
      body.instrument_name ?? symbol
    ).trim();

  const side =
    String(
      body.side ?? ""
    ) as TradeSide;

  const rawQuantity =
    Number(body.quantity);

  const quantity =
    Math.round(
      rawQuantity * 100000000
    ) / 100000000;

  if (!symbol) {
    return NextResponse.json(
      {
        error: "Symbol fehlt.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    side !== "buy" &&
    side !== "sell"
  ) {
    return NextResponse.json(
      {
        error:
          "Ungültige Orderart.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    !Number.isFinite(quantity) ||
    quantity <= 0
  ) {
    return NextResponse.json(
      {
        error:
          "Gib eine gültige Stückzahl ein.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    quantity >
    100000000
  ) {
    return NextResponse.json(
      {
        error:
          "Stückzahl ist zu groß.",
      },
      {
        status: 400,
      }
    );
  }

  const apiKey =
    process.env.TWELVE_DATA_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Twelve Data API-Key fehlt.",
      },
      {
        status: 500,
      }
    );
  }

  try {
    /*
     * GANZ WICHTIG:
     * Preis wird NICHT vom Browser übernommen.
     */
    const quote =
      await getQuote({
        symbol,
        exchange:
          exchange || undefined,
        apiKey,
      });

    const priceNative =
      Number(quote.close);

    if (
      !Number.isFinite(
        priceNative
      ) ||
      priceNative <= 0
    ) {
      throw new Error(
        "Ungültiger Marktpreis."
      );
    }

    const currency =
      String(
        quote.currency ??
          "EUR"
      ).toUpperCase();

    const fxRateToEur =
      await getFxRateToEur({
        currency,
        apiKey,
      });

    const priceEur =
      priceNative *
      fxRateToEur;

    const instrumentName =
      String(
        quote.name ??
          requestedName ??
          symbol
      );

    const admin =
      createAdminClient();

    const {
      data,
      error,
    } = await admin.rpc(
      "execute_personal_trade",
      {
        p_user_id:
          user.id,

        p_symbol:
          symbol,

        p_exchange:
          quote.exchange ??
          exchange ??
          null,

        p_mic_code:
          quote.mic_code ??
          null,

        p_instrument_name:
          instrumentName,

        p_side:
          side,

        p_quantity:
          quantity,

        p_currency:
          currency,

        p_price_native:
          priceNative,

        p_fx_rate_to_eur:
          fxRateToEur,

        p_price_eur:
          priceEur,
      }
    );

    if (error) {
      return NextResponse.json(
        {
          error:
            error.message,
        },
        {
          status: 400,
        }
      );
    }

    const result =
      data?.[0];

    return NextResponse.json({
      success: true,

      side,

      symbol,

      quantity,

      instrument_name:
        instrumentName,

      execution: {
        price_native:
          priceNative,

        currency,

        fx_rate_to_eur:
          fxRateToEur,

        price_eur:
          priceEur,

        trade_value_eur:
          Number(
            result?.trade_value_eur ??
              quantity *
                priceEur
          ),

        quote_datetime:
          quote.datetime ??
          null,

        is_market_open:
          quote.is_market_open ??
          null,
      },

      portfolio: {
        cash_balance:
          Number(
            result?.cash_balance ??
              0
          ),

        position_quantity:
          Number(
            result?.position_quantity ??
              0
          ),
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Order konnte nicht ausgeführt werden.";

    return NextResponse.json(
      {
        error: message,
      },
      {
        status: 500,
      }
    );
  }
}