"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Loader2,
  Wallet,
} from "lucide-react";

import { useRouter } from "next/navigation";

type Side =
  | "buy"
  | "sell";

type Position = {
  quantity: string | number;
  average_cost_native:
    | string
    | number;
  average_cost_eur:
    | string
    | number;
};

function formatEur(
  value: number
) {
  return new Intl.NumberFormat(
    "de-DE",
    {
      style: "currency",
      currency: "EUR",
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

export default function TradeBox({
  symbol,
  exchange,
  instrumentName,
  currency,
  indicativePrice,
}: {
  symbol: string;
  exchange?: string;
  instrumentName: string;
  currency: string;
  indicativePrice:
    | number
    | null;
}) {
  const router =
    useRouter();

  const [side, setSide] =
    useState<Side>("buy");

  const [quantity, setQuantity] =
    useState("1");

  const [cash, setCash] =
    useState(0);

  const [
    positionQuantity,
    setPositionQuantity,
  ] = useState(0);

  const [
    averageCost,
    setAverageCost,
  ] = useState<
    number | null
  >(null);

  const [loading, setLoading] =
    useState(false);

  const [
    overviewLoading,
    setOverviewLoading,
  ] = useState(true);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  async function loadOverview() {
    setOverviewLoading(true);

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
          `/api/trade?${params.toString()}`
        );

      const json =
        await response.json();

      if (!response.ok) {
        setError(
          json.error ??
            "Trading-Daten konnten nicht geladen werden."
        );

        return;
      }

      setCash(
        Number(
          json.cash_balance ??
            0
        )
      );

      const position =
        json.position as
          | Position
          | null;

      setPositionQuantity(
        Number(
          position?.quantity ??
            0
        )
      );

      setAverageCost(
        position
          ? Number(
              position.average_cost_eur
            )
          : null
      );
    } finally {
      setOverviewLoading(false);
    }
  }

  useEffect(() => {
    loadOverview();
  }, [symbol, exchange]);

  const quantityNumber =
    Number(quantity);

  const estimatedNative =
    indicativePrice !== null &&
    Number.isFinite(
      quantityNumber
    )
      ? indicativePrice *
        quantityNumber
      : null;

  async function submitTrade() {
    setError("");
    setMessage("");

    if (
      !Number.isFinite(
        quantityNumber
      ) ||
      quantityNumber <= 0
    ) {
      setError(
        "Bitte gib eine gültige Stückzahl ein."
      );

      return;
    }

    setLoading(true);

    try {
      const response =
        await fetch(
          "/api/trade",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              symbol,
              exchange,
              instrument_name:
                instrumentName,
              side,
              quantity:
                quantityNumber,
            }),
          }
        );

      const json =
        await response.json();

      if (!response.ok) {
        setError(
          json.error ??
            "Order konnte nicht ausgeführt werden."
        );

        return;
      }

      const action =
        side === "buy"
          ? "gekauft"
          : "verkauft";

      setMessage(
        `${quantityNumber.toLocaleString(
          "de-DE"
        )} ${symbol} ${action} · ${formatEur(
          Number(
            json.execution
              .trade_value_eur
          )
        )}`
      );

      setCash(
        Number(
          json.portfolio
            .cash_balance
        )
      );

      setPositionQuantity(
        Number(
          json.portfolio
            .position_quantity
        )
      );

      /*
       * Portfolio/Dashboard beim
       * nächsten Render aktualisieren.
       */
      router.refresh();

      await loadOverview();
    } catch {
      setError(
        "Order konnte nicht ausgeführt werden."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-[#101014] p-6">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-fuchsia-500/10 p-2 text-fuchsia-400">
          <Wallet size={21} />
        </div>

        <div>
          <h2 className="text-xl font-semibold">
            Handeln
          </h2>

          <p className="text-sm text-zinc-500">
            Virtuelles TradeVerse-Kapital
          </p>
        </div>
      </div>

      {overviewLoading ? (
        <div className="mt-6">
          <Loader2 className="animate-spin text-fuchsia-400" />
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/5 bg-black/30 p-4">
              <p className="text-xs text-zinc-500">
                Verfügbares Spielgeld
              </p>

              <p className="mt-2 text-lg font-semibold">
                {formatEur(cash)}
              </p>
            </div>

            <div className="rounded-2xl border border-white/5 bg-black/30 p-4">
              <p className="text-xs text-zinc-500">
                Dein Bestand
              </p>

              <p className="mt-2 text-lg font-semibold">
                {positionQuantity.toLocaleString(
                  "de-DE",
                  {
                    maximumFractionDigits: 8,
                  }
                )}{" "}
                {symbol}
              </p>

              {averageCost !== null ? (
                <p className="mt-1 text-xs text-zinc-600">
                  Ø Kaufkurs{" "}
                  {formatEur(
                    averageCost
                  )}
                </p>
              ) : null}
            </div>
          </div>

          {/* Kaufen / Verkaufen */}
          <div className="mt-6 grid grid-cols-2 rounded-2xl bg-black/30 p-1">
            <button
              type="button"
              onClick={() =>
                setSide("buy")
              }
              className={`flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition ${
                side === "buy"
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "text-zinc-500 hover:text-white"
              }`}
            >
              <ArrowDownToLine
                size={17}
              />
              Kaufen
            </button>

            <button
              type="button"
              onClick={() =>
                setSide("sell")
              }
              className={`flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition ${
                side === "sell"
                  ? "bg-red-500/15 text-red-400"
                  : "text-zinc-500 hover:text-white"
              }`}
            >
              <ArrowUpFromLine
                size={17}
              />
              Verkaufen
            </button>
          </div>

          {/* Menge */}
          <div className="mt-5">
            <label className="text-sm text-zinc-400">
              Stückzahl
            </label>

            <input
              type="number"
              min="0.00000001"
              step="0.00000001"
              value={quantity}
              onChange={(event) =>
                setQuantity(
                  event.target.value
                )
              }
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-lg font-semibold text-white outline-none transition focus:border-fuchsia-500/40"
            />
          </div>

          {estimatedNative !== null ? (
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-zinc-500">
                Ungefähre Ordersumme
              </span>

              <span className="font-medium text-zinc-300">
                {formatNative(
                  estimatedNative,
                  currency
                )}
              </span>
            </div>
          ) : null}

          <p className="mt-3 text-xs leading-5 text-zinc-600">
            Der tatsächliche
            Ausführungskurs wird beim
            Absenden erneut
            serverseitig über Twelve
            Data geladen.
          </p>

          {error ? (
            <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
              {error}
            </div>
          ) : null}

          {message ? (
            <div className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
              {message}
            </div>
          ) : null}

          <button
            type="button"
            disabled={loading}
            onClick={submitTrade}
            className={`mt-6 flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
              side === "buy"
                ? "bg-emerald-600 hover:bg-emerald-500"
                : "bg-red-600 hover:bg-red-500"
            }`}
          >
            {loading ? (
              <>
                <Loader2
                  size={18}
                  className="animate-spin"
                />

                Order wird ausgeführt...
              </>
            ) : side === "buy" ? (
              `${symbol} kaufen`
            ) : (
              `${symbol} verkaufen`
            )}
          </button>
        </>
      )}
    </section>
  );
}