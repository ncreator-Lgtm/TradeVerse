"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  AreaSeries,
  CandlestickSeries,
  ColorType,
  HistogramSeries,
  LineSeries,
  createChart,
  type UTCTimestamp,
} from "lightweight-charts";

import {
  AreaChart,
  BarChart3,
  CandlestickChart,
  Loader2,
} from "lucide-react";

import TradeBox from "@/components/trade-box";

type ChartType =
  | "line"
  | "area"
  | "candlestick";

type Range =
  | "1D"
  | "5D"
  | "1M"
  | "3M"
  | "6M"
  | "YTD"
  | "1Y"
  | "3Y"
  | "ALL";

type ChartValue = {
  datetime: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume?: string;
};

type QuoteData = {
  symbol?: string;
  name?: string;
  exchange?: string;
  currency?: string;
  datetime?: string;

  open?: string;
  high?: string;
  low?: string;
  close?: string;

  previous_close?: string;
  change?: string;
  percent_change?: string;

  volume?: string;
};

const ranges: Range[] = [
  "1D",
  "5D",
  "1M",
  "3M",
  "6M",
  "YTD",
  "1Y",
  "3Y",
  "ALL",
];

function toTimestamp(
  datetime: string
): UTCTimestamp {
  let normalized: string;

  if (datetime.length === 10) {
    normalized =
      `${datetime}T00:00:00Z`;
  } else {
    normalized =
      `${datetime.replace(" ", "T")}Z`;
  }

  return Math.floor(
    new Date(normalized).getTime() / 1000
  ) as UTCTimestamp;
}

function formatCurrency(
  value: number | null,
  currency: string
) {
  if (
    value === null ||
    !Number.isFinite(value)
  ) {
    return "—";
  }

  try {
    return new Intl.NumberFormat(
      "de-DE",
      {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
      }
    ).format(value);
  } catch {
    return value.toLocaleString(
      "de-DE",
      {
        maximumFractionDigits: 2,
      }
    );
  }
}

function formatCompact(
  value: number | null
) {
  if (
    value === null ||
    !Number.isFinite(value)
  ) {
    return "—";
  }

  return new Intl.NumberFormat(
    "de-DE",
    {
      notation: "compact",
      maximumFractionDigits: 2,
    }
  ).format(value);
}

export default function MarketInstrument({
  symbol,
  exchange,
  instrumentName,
  initialCurrency,
}: {
  symbol: string;
  exchange?: string;
  instrumentName?: string;
  initialCurrency?: string;
}) {
  const chartContainer =
    useRef<HTMLDivElement>(null);

  const [range, setRange] =
    useState<Range>("1D");

  const [chartType, setChartType] =
    useState<ChartType>("line");

  const [showVolume, setShowVolume] =
    useState(true);

  const [chartValues, setChartValues] =
    useState<ChartValue[]>([]);

  const [quote, setQuote] =
    useState<QuoteData | null>(null);

  const [monthHigh, setMonthHigh] =
    useState<number | null>(null);

  const [monthLow, setMonthLow] =
    useState<number | null>(null);

  const [chartLoading, setChartLoading] =
    useState(true);

  const [quoteLoading, setQuoteLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /*
   * Aktuellen Kurs laden.
   */
  useEffect(() => {
    async function loadQuote() {
      setQuoteLoading(true);

      const params =
        new URLSearchParams({
          symbol,
        });

      if (exchange) {
        params.set(
          "exchange",
          exchange
        );
      }

      try {
        const response =
          await fetch(
            `/api/market/quote?${params.toString()}`
          );

        const json =
          await response.json();

        if (!response.ok) {
          setError(
            json.error ??
              "Kurs konnte nicht geladen werden."
          );

          return;
        }

        setQuote(json.quote);
        setMonthHigh(
          json.month_high
        );
        setMonthLow(
          json.month_low
        );
      } catch {
        setError(
          "Kurs konnte nicht geladen werden."
        );
      } finally {
        setQuoteLoading(false);
      }
    }

    loadQuote();
  }, [symbol, exchange]);

  /*
   * Chartdaten laden.
   */
  useEffect(() => {
    async function loadChart() {
      setChartLoading(true);
      setError("");

      const params =
        new URLSearchParams({
          symbol,
          range,
        });

      if (exchange) {
        params.set(
          "exchange",
          exchange
        );
      }

      try {
        const response =
          await fetch(
            `/api/market/chart?${params.toString()}`
          );

        const json =
          await response.json();

        if (!response.ok) {
          setError(
            json.error ??
              "Chart konnte nicht geladen werden."
          );

          setChartValues([]);
          return;
        }

        setChartValues(
          json.values ?? []
        );
      } catch {
        setError(
          "Chart konnte nicht geladen werden."
        );

        setChartValues([]);
      } finally {
        setChartLoading(false);
      }
    }

    loadChart();
  }, [symbol, exchange, range]);

  /*
   * Chart zeichnen.
   */
  useEffect(() => {
    const container =
      chartContainer.current;

    if (
      !container ||
      chartValues.length === 0
    ) {
      return;
    }

    const chart = createChart(
      container,
      {
        width:
          container.clientWidth,

        height: 480,

        layout: {
          background: {
            type: ColorType.Solid,
            color: "#101014",
          },

          textColor: "#71717a",
        },

        grid: {
          vertLines: {
            color: "#18181b",
          },

          horzLines: {
            color: "#18181b",
          },
        },

        rightPriceScale: {
          borderColor: "#27272a",
        },

        timeScale: {
          borderColor: "#27272a",

          timeVisible:
            range === "1D" ||
            range === "5D" ||
            range === "1M",
        },

        handleScroll: true,
        handleScale: true,
      }
    );

    const lineData =
      chartValues.map(
        (item) => ({
          time: toTimestamp(
            item.datetime
          ),

          value: Number(
            item.close
          ),
        })
      );

    const candleData =
      chartValues.map(
        (item) => ({
          time: toTimestamp(
            item.datetime
          ),

          open: Number(
            item.open
          ),

          high: Number(
            item.high
          ),

          low: Number(
            item.low
          ),

          close: Number(
            item.close
          ),
        })
      );

    let priceSeries;

    if (
      chartType === "line"
    ) {
      priceSeries =
        chart.addSeries(
          LineSeries,
          {
            color: "#d946ef",
            lineWidth: 2,
            priceLineVisible:
              false,
          }
        );

      priceSeries.setData(
        lineData
      );
    }

    if (
      chartType === "area"
    ) {
      priceSeries =
        chart.addSeries(
          AreaSeries,
          {
            lineColor:
              "#d946ef",

            topColor:
              "rgba(217,70,239,0.32)",

            bottomColor:
              "rgba(217,70,239,0.02)",

            lineWidth: 2,

            priceLineVisible:
              false,
          }
        );

      priceSeries.setData(
        lineData
      );
    }

    if (
      chartType ===
      "candlestick"
    ) {
      priceSeries =
        chart.addSeries(
          CandlestickSeries,
          {
            upColor:
              "#10b981",

            downColor:
              "#ef4444",

            borderUpColor:
              "#10b981",

            borderDownColor:
              "#ef4444",

            wickUpColor:
              "#10b981",

            wickDownColor:
              "#ef4444",
          }
        );

      priceSeries.setData(
        candleData
      );
    }

    if (priceSeries) {
      priceSeries
        .priceScale()
        .applyOptions({
          scaleMargins: {
            top: 0.08,

            bottom:
              showVolume
                ? 0.25
                : 0.08,
          },
        });
    }

    if (showVolume) {
      const volumeSeries =
        chart.addSeries(
          HistogramSeries,
          {
            priceFormat: {
              type: "volume",
            },

            priceScaleId: "",
          }
        );

      volumeSeries.setData(
        chartValues.map(
          (item) => ({
            time: toTimestamp(
              item.datetime
            ),

            value:
              Number(
                item.volume ?? 0
              ),

            color:
              Number(item.close) >=
              Number(item.open)
                ? "rgba(16,185,129,0.35)"
                : "rgba(239,68,68,0.35)",
          })
        )
      );

      volumeSeries
        .priceScale()
        .applyOptions({
          scaleMargins: {
            top: 0.78,
            bottom: 0,
          },
        });
    }

    chart
      .timeScale()
      .fitContent();

    function resize() {
      chart.applyOptions({
        width:
          container.clientWidth,
      });
    }

    window.addEventListener(
      "resize",
      resize
    );

    return () => {
      window.removeEventListener(
        "resize",
        resize
      );

      chart.remove();
    };
  }, [
    chartValues,
    chartType,
    showVolume,
    range,
  ]);

  const currency =
    quote?.currency ??
    initialCurrency ??
    "USD";

  const currentPrice =
    Number(
      quote?.close
    );

  const percentChange =
    Number(
      quote?.percent_change
    );

  const open =
    Number(
      quote?.open
    );

  const volume =
    Number(
      quote?.volume
    );

  const name =
    instrumentName ??
    quote?.name ??
    symbol;

  return (
    <div>
      {/* HEADER */}
      <section>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold md:text-4xl">
                {name}
              </h1>

              <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-zinc-500">
                {symbol}
              </span>

              {exchange ? (
                <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-zinc-600">
                  {exchange}
                </span>
              ) : null}
            </div>

            {quoteLoading ? (
              <Loader2 className="mt-5 animate-spin text-fuchsia-400" />
            ) : (
              <div className="mt-5 flex flex-wrap items-end gap-4">
                <p className="text-4xl font-bold md:text-5xl">
                  {formatCurrency(
                    currentPrice,
                    currency
                  )}
                </p>

                {Number.isFinite(
                  percentChange
                ) ? (
                  <span
                    className={`mb-1 rounded-full px-3 py-1 text-sm font-semibold ${
                      percentChange >= 0
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    {percentChange >= 0
                      ? "+"
                      : ""}

                    {percentChange.toLocaleString(
                      "de-DE",
                      {
                        minimumFractionDigits:
                          2,

                        maximumFractionDigits:
                          2,
                      }
                    )}

                    %
                  </span>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CHART */}
      <section className="mt-8 rounded-3xl border border-white/10 bg-[#101014] p-4 md:p-6">
        <div className="flex flex-wrap gap-2">
          {ranges.map(
            (item) => (
              <button
                key={item}
                type="button"
                onClick={() =>
                  setRange(item)
                }
                className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                  range === item
                    ? "bg-fuchsia-500/15 text-fuchsia-300"
                    : "text-zinc-500 hover:bg-white/5 hover:text-white"
                }`}
              >
                {item === "ALL"
                  ? "All"
                  : item}
              </button>
            )
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/5 pt-4">
          <button
            type="button"
            onClick={() =>
              setChartType(
                "line"
              )
            }
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${
              chartType === "line"
                ? "bg-white/10 text-white"
                : "text-zinc-500"
            }`}
          >
            <BarChart3
              size={15}
            />
            Linie
          </button>

          <button
            type="button"
            onClick={() =>
              setChartType(
                "area"
              )
            }
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${
              chartType === "area"
                ? "bg-white/10 text-white"
                : "text-zinc-500"
            }`}
          >
            <AreaChart
              size={15}
            />
            Berg
          </button>

          <button
            type="button"
            onClick={() =>
              setChartType(
                "candlestick"
              )
            }
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${
              chartType ===
              "candlestick"
                ? "bg-white/10 text-white"
                : "text-zinc-500"
            }`}
          >
            <CandlestickChart
              size={15}
            />
            Kerzen
          </button>

          <label className="ml-auto flex cursor-pointer items-center gap-2 text-xs text-zinc-400">
            <input
              type="checkbox"
              checked={
                showVolume
              }
              onChange={(
                event
              ) =>
                setShowVolume(
                  event.target
                    .checked
                )
              }
            />

            Volumen anzeigen
          </label>
        </div>

        {error ? (
          <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        ) : null}

        <div className="relative mt-5 min-h-[480px]">
          {chartLoading ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#101014]/80">
              <Loader2 className="animate-spin text-fuchsia-400" />
            </div>
          ) : null}

          <div
            ref={
              chartContainer
            }
            className="w-full"
          />
        </div>

        <p className="mt-2 text-xs text-zinc-600">
          Scrollen zum Zoomen · Ziehen zum Verschieben
        </p>
      </section>

      {/* FINANZDATEN */}
      <section className="mt-6">
        <h2 className="text-xl font-semibold">
          Finanzdaten
        </h2>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label:
                "Eröffnungspreis",

              value:
                formatCurrency(
                  open,
                  currency
                ),
            },

            {
              label:
                "Monatshoch",

              value:
                formatCurrency(
                  monthHigh,
                  currency
                ),
            },

            {
              label:
                "Monatstief",

              value:
                formatCurrency(
                  monthLow,
                  currency
                ),
            },

            {
              label:
                "Marktkap.",

              value: "—",
            },

            {
              label:
                "KGV",

              value: "—",
            },

            {
              label:
                "Vol.",

              value:
                formatCompact(
                  volume
                ),
            },

            {
              label:
                "Dividende je Aktie",

              value: "—",
            },

            {
              label:
                "EPS",

              value: "—",
            },
          ].map(
            (item) => (
              <div
                key={
                  item.label
                }
                className="rounded-2xl border border-white/10 bg-[#101014] p-5"
              >
                <p className="text-xs text-zinc-500">
                  {
                    item.label
                  }
                </p>

                <p className="mt-2 text-lg font-semibold">
                  {
                    item.value
                  }
                </p>
              </div>
            )
          )}
        </div>
      </section>

      {/* KAUFEN / VERKAUFEN */}
      <section className="mt-6">
        <TradeBox
          symbol={symbol}
          exchange={
            exchange
          }
          instrumentName={
            name
          }
          currency={
            currency
          }
          indicativePrice={
            Number.isFinite(
              currentPrice
            )
              ? currentPrice
              : null
          }
        />
      </section>
    </div>
  );
}