"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Search,
  Plus,
  Trash2,
  Star,
  Loader2,
  ChevronRight,
} from "lucide-react";

type Instrument = {
  symbol: string;
  instrument_name: string;
  exchange?: string;
  mic_code?: string;
  instrument_type?: string;
  country?: string;
  currency?: string;
  wkn?: string;
  figi?: string;
};

type WatchlistItem = Instrument & {
  id: string;
};

function instrumentHref(instrument: Instrument) {
  const params = new URLSearchParams();

  if (instrument.exchange) {
    params.set("exchange", instrument.exchange);
  }

  if (instrument.instrument_name) {
    params.set("name", instrument.instrument_name);
  }

  if (instrument.currency) {
    params.set("currency", instrument.currency);
  }

  if (instrument.wkn) {
    params.set("wkn", instrument.wkn);
  }

  const query = params.toString();

  return `/market/${encodeURIComponent(instrument.symbol)}${
    query ? `?${query}` : ""
  }`;
}

export default function MarketSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Instrument[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function loadWatchlist() {
    const response = await fetch("/api/watchlist");
    const json = await response.json();

    if (response.ok) {
      setWatchlist(json.data ?? []);
    }
  }

  useEffect(() => {
    loadWatchlist();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      setLoading(true);

      try {
        const response = await fetch(
          `/api/market/search?q=${encodeURIComponent(query)}`
        );

        const json = await response.json();

        if (response.ok) {
          setResults(json.data ?? []);
        } else {
          setResults([]);
        }
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(timeout);
  }, [query]);

  async function addToWatchlist(instrument: Instrument) {
    setMessage("");

    try {
      const response = await fetch("/api/watchlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(instrument),
      });

      const json = await response.json();

      if (!response.ok) {
        setMessage(
          json.error ??
            "Das Wertpapier konnte nicht gespeichert werden."
        );
        return;
      }

      setWatchlist((current) => [
        json.data,
        ...current.filter((item) => item.id !== json.data.id),
      ]);

      setMessage(
        `${instrument.instrument_name} wurde zur Watchlist hinzugefügt.`
      );
    } catch {
      setMessage("Fehler beim Hinzufügen zur Watchlist.");
    }
  }

  async function removeFromWatchlist(id: string) {
    const response = await fetch("/api/watchlist", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });

    if (response.ok) {
      setWatchlist((current) =>
        current.filter((item) => item.id !== id)
      );
    }
  }

  function isSaved(instrument: Instrument) {
    return watchlist.some(
      (item) =>
        item.symbol === instrument.symbol &&
        (item.exchange ?? "") === (instrument.exchange ?? "")
    );
  }

  return (
    <div className="space-y-8">
      {/* SUCHE */}
      <section className="rounded-3xl border border-white/10 bg-[#101014] p-6">
        <div className="relative">
          <Search
            size={20}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
          />

          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name, Ticker oder WKN suchen – z. B. Apple, AAPL oder 865985"
            className="w-full rounded-2xl border border-white/10 bg-black/30 py-4 pl-12 pr-12 text-white outline-none transition placeholder:text-zinc-600 focus:border-fuchsia-500/40"
          />

          {loading ? (
            <Loader2
              size={19}
              className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-fuchsia-400"
            />
          ) : null}
        </div>

        <p className="mt-3 text-xs text-zinc-600">
          Suche nach Unternehmensname, Ticker oder sechsstelliger WKN.
        </p>

        {message ? (
          <p className="mt-4 text-sm text-fuchsia-300">
            {message}
          </p>
        ) : null}
      </section>

      {/* ERGEBNISSE */}
      <section>
        <div className="flex items-center gap-2">
          <Search size={18} className="text-fuchsia-400" />

          <h2 className="text-xl font-semibold">
            {query ? "Suchergebnisse" : "Beliebte Wertpapiere"}
          </h2>
        </div>

        <div className="mt-4 space-y-3">
          {results.map((instrument, index) => {
            const saved = isSaved(instrument);

            return (
              <article
                key={`${instrument.symbol}-${instrument.exchange}-${index}`}
                className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#101014] p-5 transition hover:border-fuchsia-500/20 sm:flex-row sm:items-center"
              >
                <Link
                  href={instrumentHref(instrument)}
                  className="group min-w-0 flex-1"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-lg font-bold text-white">
                      {instrument.symbol}
                    </span>

                    {instrument.exchange ? (
                      <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-zinc-500">
                        {instrument.exchange}
                      </span>
                    ) : null}

                    {instrument.currency ? (
                      <span className="text-xs text-zinc-600">
                        {instrument.currency}
                      </span>
                    ) : null}

                    {instrument.wkn ? (
                      <span className="rounded-full bg-fuchsia-500/10 px-2.5 py-1 text-xs text-fuchsia-300">
                        WKN {instrument.wkn}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-1 flex items-center gap-2">
                    <p className="text-sm text-zinc-300 transition group-hover:text-white">
                      {instrument.instrument_name}
                    </p>

                    <ChevronRight
                      size={16}
                      className="text-zinc-700 transition group-hover:translate-x-1 group-hover:text-fuchsia-400"
                    />
                  </div>

                  <p className="mt-1 text-xs text-zinc-600">
                    {[instrument.instrument_type, instrument.country]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </Link>

                <button
                  type="button"
                  disabled={saved}
                  onClick={() => addToWatchlist(instrument)}
                  className={`flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
                    saved
                      ? "cursor-default bg-emerald-500/10 text-emerald-400"
                      : "bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:opacity-90"
                  }`}
                >
                  {saved ? (
                    <>
                      <Star size={17} />
                      Gespeichert
                    </>
                  ) : (
                    <>
                      <Plus size={17} />
                      Watchlist
                    </>
                  )}
                </button>
              </article>
            );
          })}
        </div>
      </section>

      {/* WATCHLIST AUF DER MARKTSEITE */}
      <section>
        <div className="flex items-center gap-2">
          <Star size={19} className="text-yellow-400" />

          <h2 className="text-xl font-semibold">
            Deine Watchlist
          </h2>
        </div>

        {watchlist.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-white/10 bg-[#101014] p-6 text-sm text-zinc-500">
            Noch keine Wertpapiere gespeichert.
          </div>
        ) : (
          <div className="mt-4 grid gap-3">
            {watchlist.map((item) => (
              <article
                key={item.id}
                className="flex items-center gap-4 rounded-2xl border border-white/10 bg-[#101014] p-5"
              >
                <Link
                  href={instrumentHref(item)}
                  className="group min-w-0 flex-1"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="font-bold">
                      {item.symbol}
                    </p>

                    {item.exchange ? (
                      <span className="text-xs text-zinc-600">
                        {item.exchange}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-1 flex items-center gap-2">
                    <p className="text-sm text-zinc-400 group-hover:text-white">
                      {item.instrument_name}
                    </p>

                    <ChevronRight
                      size={15}
                      className="text-zinc-700 group-hover:text-fuchsia-400"
                    />
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={() => removeFromWatchlist(item.id)}
                  className="rounded-xl border border-white/10 p-2 text-zinc-500 transition hover:border-red-500/30 hover:text-red-400"
                >
                  <Trash2 size={18} />
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}