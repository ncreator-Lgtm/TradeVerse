import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type PositionRow = {
  id: string;
  symbol: string;
  exchange: string | null;
  mic_code: string | null;
  instrument_name: string;
  currency: string;
  quantity: string | number;
  average_cost_native: string | number;
  average_cost_eur: string | number;
};

async function getQuote({
  symbol,
  exchange,
  apiKey,
}: {
  symbol: string;
  exchange?: string | null;
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
      next: {
        revalidate: 15,
      },
    }
  );

  const result = await response.json();

  if (
    !response.ok ||
    result.status === "error"
  ) {
    throw new Error(
      result.message ??
        `Kurs für ${symbol} konnte nicht geladen werden.`
    );
  }

  return result;
}

async function getFxRate({
  currency,
  apiKey,
}: {
  currency: string;
  apiKey: string;
}) {
  const upperCurrency =
    currency.toUpperCase();

  if (upperCurrency === "EUR") {
    return 1;
  }

  const params = new URLSearchParams({
    symbol: `${upperCurrency}/EUR`,
    apikey: apiKey,
  });

  const response = await fetch(
    `https://api.twelvedata.com/exchange_rate?${params.toString()}`,
    {
      next: {
        revalidate: 60,
      },
    }
  );

  const result =
    await response.json();

  const rate =
    Number(result.rate);

  if (
    !response.ok ||
    result.status === "error" ||
    !Number.isFinite(rate) ||
    rate <= 0
  ) {
    throw new Error(
      `Wechselkurs ${upperCurrency}/EUR konnte nicht geladen werden.`
    );
  }

  return rate;
}

export async function GET() {
  const supabase =
    await createClient();

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

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

  const apiKey =
    process.env.TWELVE_DATA_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "TWELVE_DATA_API_KEY fehlt.",
      },
      {
        status: 500,
      }
    );
  }

  const [
    portfolioResult,
    positionsResult,
    tradesResult,
  ] = await Promise.all([
    supabase
      .from("personal_portfolios")
      .select(
        "id, starting_capital, cash_balance"
      )
      .eq("user_id", user.id)
      .single(),

    supabase
      .from("personal_positions")
      .select(
        "id, symbol, exchange, mic_code, instrument_name, currency, quantity, average_cost_native, average_cost_eur"
      )
      .eq("user_id", user.id),

    supabase
      .from("personal_trades")
      .select(
        "id, symbol, exchange, instrument_name, side, quantity, currency, price_native, price_eur, gross_value_eur, executed_at"
      )
      .eq("user_id", user.id)
      .order(
        "executed_at",
        {
          ascending: false,
        }
      )
      .limit(10),
  ]);

  if (
    portfolioResult.error ||
    !portfolioResult.data
  ) {
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

  if (positionsResult.error) {
    return NextResponse.json(
      {
        error:
          "Positionen konnten nicht geladen werden.",
      },
      {
        status: 500,
      }
    );
  }

  if (tradesResult.error) {
    return NextResponse.json(
      {
        error:
          "Transaktionen konnten nicht geladen werden.",
      },
      {
        status: 500,
      }
    );
  }

  const positions =
    (positionsResult.data ??
      []) as PositionRow[];

  const fxPromises =
    new Map<
      string,
      Promise<number>
    >();

  function getCachedFx(
    currency: string
  ) {
    const key =
      currency.toUpperCase();

    if (!fxPromises.has(key)) {
      fxPromises.set(
        key,
        getFxRate({
          currency: key,
          apiKey,
        })
      );
    }

    return fxPromises.get(
      key
    )!;
  }

  const pricedPositions =
    await Promise.all(
      positions.map(
        async (position) => {
          const quantity =
            Number(
              position.quantity
            );

          const averageCostEur =
            Number(
              position.average_cost_eur
            );

          const averageCostNative =
            Number(
              position.average_cost_native
            );

          try {
            const quote =
              await getQuote({
                symbol:
                  position.symbol,

                exchange:
                  position.exchange,

                apiKey,
              });

            const currentPriceNative =
              Number(
                quote.close ??
                  quote.previous_close
              );

            if (
              !Number.isFinite(
                currentPriceNative
              ) ||
              currentPriceNative <= 0
            ) {
              throw new Error(
                "Ungültiger Kurs."
              );
            }

            const currency =
              String(
                quote.currency ??
                  position.currency ??
                  "EUR"
              ).toUpperCase();

            const fxRateToEur =
              await getCachedFx(
                currency
              );

            const currentPriceEur =
              currentPriceNative *
              fxRateToEur;

            const marketValueEur =
              quantity *
              currentPriceEur;

            const costBasisEur =
              quantity *
              averageCostEur;

            const profitLossEur =
              marketValueEur -
              costBasisEur;

            const profitLossPercent =
              costBasisEur > 0
                ? (profitLossEur /
                    costBasisEur) *
                  100
                : 0;

            return {
              id:
                position.id,

              symbol:
                position.symbol,

              exchange:
                position.exchange,

              mic_code:
                position.mic_code,

              instrument_name:
                position.instrument_name,

              currency,

              quantity,

              average_cost_native:
                averageCostNative,

              average_cost_eur:
                averageCostEur,

              current_price_native:
                currentPriceNative,

              current_price_eur:
                currentPriceEur,

              fx_rate_to_eur:
                fxRateToEur,

              market_value_eur:
                marketValueEur,

              cost_basis_eur:
                costBasisEur,

              profit_loss_eur:
                profitLossEur,

              profit_loss_percent:
                profitLossPercent,

              quote_datetime:
                quote.datetime ??
                null,

              pricing_error:
                null,
            };
          } catch (error) {
            return {
              id:
                position.id,

              symbol:
                position.symbol,

              exchange:
                position.exchange,

              mic_code:
                position.mic_code,

              instrument_name:
                position.instrument_name,

              currency:
                position.currency,

              quantity,

              average_cost_native:
                averageCostNative,

              average_cost_eur:
                averageCostEur,

              current_price_native:
                null,

              current_price_eur:
                null,

              fx_rate_to_eur:
                null,

              market_value_eur:
                null,

              cost_basis_eur:
                quantity *
                averageCostEur,

              profit_loss_eur:
                null,

              profit_loss_percent:
                null,

              quote_datetime:
                null,

              pricing_error:
                error instanceof Error
                  ? error.message
                  : "Kurs nicht verfügbar.",
            };
          }
        }
      )
    );

  pricedPositions.sort(
    (a, b) =>
      (b.market_value_eur ??
        0) -
      (a.market_value_eur ??
        0)
  );

  const cashBalance =
    Number(
      portfolioResult.data
        .cash_balance
    );

  const startingCapital =
    Number(
      portfolioResult.data
        .starting_capital
    );

  const marketValue =
    pricedPositions.reduce(
      (sum, position) =>
        sum +
        (position.market_value_eur ??
          0),
      0
    );

  const totalCostBasis =
    pricedPositions.reduce(
      (sum, position) =>
        sum +
        position.cost_basis_eur,
      0
    );

  const unrealizedProfitLoss =
    pricedPositions.reduce(
      (sum, position) =>
        sum +
        (position.profit_loss_eur ??
          0),
      0
    );

  const portfolioValue =
    cashBalance +
    marketValue;

  const totalPerformanceEur =
    portfolioValue -
    startingCapital;

  const totalPerformancePercent =
    startingCapital > 0
      ? (totalPerformanceEur /
          startingCapital) *
        100
      : 0;

  const completePricing =
    pricedPositions.every(
      (position) =>
        position.market_value_eur !==
        null
    );

  /*
   * Nur wenn ALLE Positionen korrekt bewertet
   * wurden, aktualisieren wir die Rangliste.
   *
   * So verhindert TradeVerse, dass bei einem
   * API-Fehler eine Position plötzlich mit
   * 0 € in die Rangliste eingeht.
   */
  let snapshotUpdated = false;

  if (completePricing) {
    const admin =
      createAdminClient();

    const {
      error: snapshotError,
    } = await admin
      .from(
        "personal_leaderboard_snapshots"
      )
      .upsert(
        {
          user_id:
            user.id,

          portfolio_id:
            portfolioResult.data.id,

          league_key:
            "global",

          portfolio_value_eur:
            portfolioValue,

          cash_balance_eur:
            cashBalance,

          market_value_eur:
            marketValue,

          total_performance_eur:
            totalPerformanceEur,

          total_performance_percent:
            totalPerformancePercent,

          valued_at:
            new Date().toISOString(),
        },
        {
          onConflict:
            "user_id",
        }
      );

    snapshotUpdated =
      !snapshotError;
  }

  return NextResponse.json({
    summary: {
      starting_capital:
        startingCapital,

      cash_balance:
        cashBalance,

      market_value:
        marketValue,

      invested_cost_basis:
        totalCostBasis,

      unrealized_profit_loss:
        unrealizedProfitLoss,

      portfolio_value:
        portfolioValue,

      total_performance_eur:
        totalPerformanceEur,

      total_performance_percent:
        totalPerformancePercent,

      complete_pricing:
        completePricing,
    },

    positions:
      pricedPositions,

    trades:
      tradesResult.data ??
      [],

    leaderboard_snapshot_updated:
      snapshotUpdated,

    updated_at:
      new Date().toISOString(),
  });
}