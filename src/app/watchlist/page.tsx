import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Search,
  Star,
  ChevronRight,
} from "lucide-react";

import AppShell from "@/components/app-shell";
import { createClient } from "@/lib/supabase/server";

type WatchlistItem = {
  id: string;
  symbol: string;
  instrument_name: string;
  exchange: string | null;
  currency: string | null;
  country: string | null;
  instrument_type: string | null;
};

export default async function WatchlistPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("watchlist_items")
    .select(
      "id, symbol, instrument_name, exchange, currency, country, instrument_type"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const watchlist = (data ?? []) as WatchlistItem[];

  return (
    <AppShell>
      <div>
        <p className="text-sm font-medium text-fuchsia-400">
          TradeVerse Markets
        </p>

        <div className="mt-1 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold md:text-4xl">
              Deine Watchlist
            </h1>

            <p className="mt-2 text-sm text-zinc-400">
              Behalte interessante Wertpapiere im Blick.
            </p>
          </div>

          <Link
            href="/market"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 px-4 py-2 text-sm font-medium text-white"
          >
            <Search size={17} />
            Wertpapier suchen
          </Link>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            Die Watchlist konnte nicht geladen werden.
          </div>
        ) : null}

        {watchlist.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-white/10 bg-[#101014] p-10 text-center">
            <Star
              size={32}
              className="mx-auto text-zinc-600"
            />

            <h2 className="mt-4 text-xl font-semibold">
              Deine Watchlist ist leer
            </h2>

            <p className="mt-2 text-sm text-zinc-500">
              Suche nach Wertpapieren und füge sie deiner Watchlist hinzu.
            </p>

            <Link
              href="/market"
              className="mt-6 inline-flex rounded-xl bg-white/5 px-4 py-2 text-sm text-fuchsia-300 hover:bg-white/10"
            >
              Wertpapiere entdecken
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-3">
            {watchlist.map((item) => {
              const params = new URLSearchParams();

              if (item.exchange) {
                params.set("exchange", item.exchange);
              }

              params.set("name", item.instrument_name);

              if (item.currency) {
                params.set("currency", item.currency);
              }

              const href = `/market/${encodeURIComponent(
                item.symbol
              )}?${params.toString()}`;

              return (
                <Link
                  key={item.id}
                  href={href}
                  className="group flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#101014] p-5 transition hover:border-fuchsia-500/30 hover:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-xl font-bold">
                        {item.symbol}
                      </span>

                      {item.exchange ? (
                        <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-zinc-500">
                          {item.exchange}
                        </span>
                      ) : null}

                      {item.currency ? (
                        <span className="text-xs text-zinc-600">
                          {item.currency}
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-1 text-sm text-zinc-300 transition group-hover:text-white">
                      {item.instrument_name}
                    </p>

                    <p className="mt-1 text-xs text-zinc-600">
                      {[item.instrument_type, item.country]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-yellow-400">
                    <Star
                      size={18}
                      fill="currentColor"
                    />

                    <span className="text-sm">
                      Öffnen
                    </span>

                    <ChevronRight
                      size={17}
                      className="transition group-hover:translate-x-1"
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}