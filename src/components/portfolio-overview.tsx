"use client";

import Link from "next/link";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronRight,
  History,
  Loader2,
  PieChart,
  RefreshCw,
  Search,
  Wallet,
} from "lucide-react";

type Summary = {
  starting_capital: number;
  cash_balance: number;
  market_value: number;
  invested_cost_basis: number;
  unrealized_profit_loss: number;
  portfolio_value: number;
  total_performance_eur: number;
  total_performance_percent: number;
  complete_pricing: boolean;
};

type Position = {
  id: string;
  symbol: string;
  exchange: string | null;
  instrument_name: string;
  currency: string;
  quantity: number;

  average_cost_native: number;
  average_cost_eur: number;

  current_price_native:
    | number
    | null;

  current_price_eur:
    | number
    | null;

  market_value_eur:
    | number
    | null;

  cost_basis_eur: number;

  profit_loss_eur:
    | number
    | null;

  profit_loss_percent:
    | number
    | null;

  pricing_error:
    | string
    | null;
};

type Trade = {
  id: string;
  symbol: string;
  exchange: string | null;
  instrument_name: string;
  side: "buy" | "sell";
  quantity: string | number;
  currency: string;
  price_native: string | number;
  price_eur: string | number;
  gross_value_eur:
    | string
    | number;
  executed_at: string;
};

function formatEur(
  value: number
) {
  return new Intl.NumberFormat(
    "de-DE",
    {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 2,
    }
  ).format(value);
}

function formatNative(
  value: number,
  currency: string
) {
  try {
    return new Intl.NumberFormat(
      "de-DE",
      {
        style: "currency",
        currency,
        maximumFractionDigits: 4,
      }
    ).format(value);
  } catch {
    return value.toLocaleString(
      "de-DE"
    );
  }
}

function formatPercent(
  value: number
) {
  return `${value >= 0 ? "+" : ""}${value.toLocaleString(
    "de-DE",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}%`;
}

function positionHref(
  position: Position
) {
  const params =
    new URLSearchParams();

  if (position.exchange) {
    params.set(
      "exchange",
      position.exchange
    );
  }

  params.set(
    "name",
    position.instrument_name
  );

  if (position.currency) {
    params.set(
      "currency",
      position.currency
    );
  }

  return `/market/${encodeURIComponent(
    position.symbol
  )}?${params.toString()}`;
}

export default function PortfolioOverview() {
  const [summary, setSummary] =
    useState<Summary | null>(
      null
    );

  const [
    positions,
    setPositions,
  ] =
    useState<Position[]>([]);

  const [trades, setTrades] =
    useState<Trade[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const [updatedAt, setUpdatedAt] =
    useState("");

  const loadPortfolio =
    useCallback(
      async (
        manual = false
      ) => {
        if (manual) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        try {
          const response =
            await fetch(
              "/api/portfolio/overview",
              {
                cache:
                  "no-store",
              }
            );

          const json =
            await response.json();

          if (!response.ok) {
            setError(
              json.error ??
                "Portfolio konnte nicht geladen werden."
            );

            return;
          }

          setSummary(
            json.summary
          );

          setPositions(
            json.positions ??
              []
          );

          setTrades(
            json.trades ?? []
          );

          setUpdatedAt(
            json.updated_at ??
              ""
          );
        } catch {
          setError(
            "Portfolio konnte nicht geladen werden."
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      []
    );

  useEffect(() => {
    loadPortfolio();
  }, [loadPortfolio]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="animate-spin text-fuchsia-400" />
      </div>
    );
  }

  if (
    error &&
    !summary
  ) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-300">
        {error}
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  const totalPositive =
    summary.total_performance_eur >=
    0;

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-fuchsia-400">
            Persönliches Portfolio
          </p>

          <h1 className="mt-1 text-3xl font-bold md:text-4xl">
            Dein Portfolio
          </h1>

          <p className="mt-2 text-sm text-zinc-400">
            Cash + aktueller Marktwert deiner Positionen.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/market"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/10"
          >
            <Search size={16} />
            Wertpapier suchen
          </Link>

          <button
            type="button"
            onClick={() =>
              loadPortfolio(
                true
              )
            }
            disabled={
              refreshing
            }
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />
            Aktualisieren
          </button>
        </div>
      </section>

      {/* PORTFOLIOWERT */}
      <section className="rounded-3xl border border-fuchsia-500/20 bg-gradient-to-br from-fuchsia-500/10 via-[#101014] to-purple-500/5 p-6 md:p-8">
        <p className="text-sm text-zinc-400">
          Gesamtwert
        </p>

        <div className="mt-2 flex flex-wrap items-end gap-4">
          <p className="text-4xl font-bold md:text-5xl">
            {formatEur(
              summary.portfolio_value
            )}
          </p>

          <div
            className={`mb-1 flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold ${
              totalPositive
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-red-500/10 text-red-400"
            }`}
          >
            {totalPositive ? (
              <ArrowUpRight
                size={16}
              />
            ) : (
              <ArrowDownRight
                size={16}
              />
            )}

            {formatPercent(
              summary.total_performance_percent
            )}
          </div>
        </div>

        <p
          className={`mt-3 text-sm ${
            totalPositive
              ? "text-emerald-400"
              : "text-red-400"
          }`}
        >
          {totalPositive
            ? "+"
            : ""}
          {formatEur(
            summary.total_performance_eur
          )}{" "}
          seit Start
        </p>

        {!summary.complete_pricing ? (
          <p className="mt-4 text-xs text-amber-400">
            Mindestens eine Position konnte aktuell nicht bewertet werden. Der Gesamtwert kann deshalb unvollständig sein.
          </p>
        ) : null}
      </section>

      {/* KENNZAHLEN */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-[#101014] p-5">
          <div className="flex items-center gap-2 text-zinc-500">
            <Wallet
              size={17}
            />
            <span className="text-xs">
              Verfügbares Cash
            </span>
          </div>

          <p className="mt-3 text-xl font-semibold">
            {formatEur(
              summary.cash_balance
            )}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#101014] p-5">
          <div className="flex items-center gap-2 text-zinc-500">
            <PieChart
              size={17}
            />
            <span className="text-xs">
              Marktwert Positionen
            </span>
          </div>

          <p className="mt-3 text-xl font-semibold">
            {formatEur(
              summary.market_value
            )}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#101014] p-5">
          <p className="text-xs text-zinc-500">
            Einstandswert
          </p>

          <p className="mt-3 text-xl font-semibold">
            {formatEur(
              summary.invested_cost_basis
            )}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#101014] p-5">
          <p className="text-xs text-zinc-500">
            Unrealisierter Gewinn / Verlust
          </p>

          <p
            className={`mt-3 text-xl font-semibold ${
              summary.unrealized_profit_loss >=
              0
                ? "text-emerald-400"
                : "text-red-400"
            }`}
          >
            {summary.unrealized_profit_loss >=
            0
              ? "+"
              : ""}

            {formatEur(
              summary.unrealized_profit_loss
            )}
          </p>
        </div>
      </section>

      {/* POSITIONEN */}
      <section>
        <div className="flex items-center gap-2">
          <PieChart
            size={19}
            className="text-fuchsia-400"
          />

          <h2 className="text-xl font-semibold">
            Deine Positionen
          </h2>
        </div>

        {positions.length ===
        0 ? (
          <div className="mt-4 rounded-3xl border border-white/10 bg-[#101014] p-10 text-center">
            <p className="text-lg font-semibold">
              Noch keine Positionen
            </p>

            <p className="mt-2 text-sm text-zinc-500">
              Kaufe dein erstes Wertpapier und es erscheint hier.
            </p>

            <Link
              href="/market"
              className="mt-5 inline-flex rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 px-4 py-2 text-sm font-medium text-white"
            >
              Wertpapiere entdecken
            </Link>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {positions.map(
              (position) => {
                const positive =
                  (position.profit_loss_eur ??
                    0) >= 0;

                return (
                  <Link
                    key={
                      position.id
                    }
                    href={positionHref(
                      position
                    )}
                    className="group block rounded-2xl border border-white/10 bg-[#101014] p-5 transition hover:border-fuchsia-500/30"
                  >
                    <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr_1fr_1fr_auto] lg:items-center">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-lg font-bold">
                            {
                              position.symbol
                            }
                          </span>

                          {position.exchange ? (
                            <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-zinc-600">
                              {
                                position.exchange
                              }
                            </span>
                          ) : null}
                        </div>

                        <p className="mt-1 text-sm text-zinc-400 group-hover:text-white">
                          {
                            position.instrument_name
                          }
                        </p>

                        <p className="mt-1 text-xs text-zinc-600">
                          {position.quantity.toLocaleString(
                            "de-DE",
                            {
                              maximumFractionDigits:
                                8,
                            }
                          )}{" "}
                          Stück
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-zinc-600">
                          Aktueller Kurs
                        </p>

                        <p className="mt-1 font-medium">
                          {position.current_price_native !==
                          null
                            ? formatNative(
                                position.current_price_native,
                                position.currency
                              )
                            : "—"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-zinc-600">
                          Marktwert
                        </p>

                        <p className="mt-1 font-medium">
                          {position.market_value_eur !==
                          null
                            ? formatEur(
                                position.market_value_eur
                              )
                            : "—"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-zinc-600">
                          Gewinn / Verlust
                        </p>

                        {position.profit_loss_eur !==
                          null &&
                        position.profit_loss_percent !==
                          null ? (
                          <>
                            <p
                              className={`mt-1 font-semibold ${
                                positive
                                  ? "text-emerald-400"
                                  : "text-red-400"
                              }`}
                            >
                              {positive
                                ? "+"
                                : ""}
                              {formatEur(
                                position.profit_loss_eur
                              )}
                            </p>

                            <p
                              className={`text-xs ${
                                positive
                                  ? "text-emerald-500"
                                  : "text-red-500"
                              }`}
                            >
                              {formatPercent(
                                position.profit_loss_percent
                              )}
                            </p>
                          </>
                        ) : (
                          <p className="mt-1 text-sm text-zinc-600">
                            Kurs nicht verfügbar
                          </p>
                        )}
                      </div>

                      <ChevronRight
                        size={18}
                        className="text-zinc-700 transition group-hover:translate-x-1 group-hover:text-fuchsia-400"
                      />
                    </div>

                    {position.pricing_error ? (
                      <p className="mt-3 text-xs text-amber-400">
                        {
                          position.pricing_error
                        }
                      </p>
                    ) : null}
                  </Link>
                );
              }
            )}
          </div>
        )}
      </section>

      {/* TRANSAKTIONSHISTORIE */}
      <section>
        <div className="flex items-center gap-2">
          <History
            size={19}
            className="text-fuchsia-400"
          />

          <h2 className="text-xl font-semibold">
            Letzte Transaktionen
          </h2>
        </div>

        {trades.length ===
        0 ? (
          <div className="mt-4 rounded-2xl border border-white/10 bg-[#101014] p-6 text-sm text-zinc-500">
            Noch keine Transaktionen vorhanden.
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-[#101014]">
            {trades.map(
              (
                trade,
                index
              ) => {
                const isBuy =
                  trade.side ===
                  "buy";

                return (
                  <div
                    key={
                      trade.id
                    }
                    className={`flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between ${
                      index !==
                      trades.length -
                        1
                        ? "border-b border-white/5"
                        : ""
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            isBuy
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-red-500/10 text-red-400"
                          }`}
                        >
                          {isBuy
                            ? "Kauf"
                            : "Verkauf"}
                        </span>

                        <span className="font-semibold">
                          {
                            trade.symbol
                          }
                        </span>
                      </div>

                      <p className="mt-2 text-xs text-zinc-500">
                        {Number(
                          trade.quantity
                        ).toLocaleString(
                          "de-DE",
                          {
                            maximumFractionDigits:
                              8,
                          }
                        )}{" "}
                        Stück ·{" "}
                        {new Date(
                          trade.executed_at
                        ).toLocaleString(
                          "de-DE"
                        )}
                      </p>
                    </div>

                    <div className="sm:text-right">
                      <p className="font-semibold">
                        {formatEur(
                          Number(
                            trade.gross_value_eur
                          )
                        )}
                      </p>

                      <p className="mt-1 text-xs text-zinc-600">
                        {formatNative(
                          Number(
                            trade.price_native
                          ),
                          trade.currency
                        )}{" "}
                        je Stück
                      </p>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </section>

      {updatedAt ? (
        <p className="text-xs text-zinc-700">
          Marktdaten zuletzt aktualisiert:{" "}
          {new Date(
            updatedAt
          ).toLocaleString(
            "de-DE"
          )}
        </p>
      ) : null}
    </div>
  );
}