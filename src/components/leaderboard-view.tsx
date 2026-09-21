"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Crown,
  Loader2,
  Medal,
  RefreshCw,
  Trophy,
} from "lucide-react";

type LeaderboardEntry = {
  rank: number;
  user_id: string;
  username: string;
  display_name: string;
  portfolio_value_eur: number;
  cash_balance_eur: number;
  market_value_eur: number;
  total_performance_eur: number;
  total_performance_percent: number;
  valued_at: string | null;
  is_current_user: boolean;
};

function formatEur(value: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;
}

export default function LeaderboardView() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentRank, setCurrentRank] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadLeaderboard = useCallback(
    async (refreshMyPortfolio = false) => {
      setError("");

      if (refreshMyPortfolio) {
        setRefreshing(true);
      }

      try {
        if (refreshMyPortfolio) {
          const portfolioResponse = await fetch(
            "/api/portfolio/overview",
            {
              cache: "no-store",
            }
          );

          if (!portfolioResponse.ok) {
            const portfolioJson = await portfolioResponse.json();

            setError(
              portfolioJson.error ??
                "Dein Portfolio konnte nicht aktualisiert werden."
            );
          }
        }

        const response = await fetch("/api/leaderboard", {
          cache: "no-store",
        });

        const json = await response.json();

        if (!response.ok) {
          setError(
            json.error ??
              "Rangliste konnte nicht geladen werden."
          );

          return;
        }

        setLeaderboard(json.leaderboard ?? []);
        setCurrentRank(json.current_user_rank ?? null);
      } catch {
        setError(
          "Rangliste konnte nicht geladen werden."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadLeaderboard(true);
  }, [loadLeaderboard]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="animate-spin text-fuchsia-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-fuchsia-400">
            TradeVerse Ranking
          </p>

          <h1 className="mt-1 text-3xl font-bold md:text-4xl">
            Rangliste
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
            Entscheidend ist der aktuelle Gesamtwert:
            Cash + Marktwert aller Positionen.
          </p>
        </div>

        <button
          type="button"
          disabled={refreshing}
          onClick={() => loadLeaderboard(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={refreshing ? "animate-spin" : ""}
          />

          Meine Bewertung aktualisieren
        </button>
      </section>

      <section className="rounded-3xl border border-fuchsia-500/20 bg-gradient-to-br from-fuchsia-500/10 via-[#101014] to-purple-500/5 p-6">
        <p className="text-sm text-zinc-500">
          Dein aktueller Rang
        </p>

        <div className="mt-2 flex items-center gap-3">
          <Trophy className="text-fuchsia-400" />

          <p className="text-4xl font-bold">
            {currentRank ? `#${currentRank}` : "—"}
          </p>
        </div>

        <p className="mt-3 text-xs text-zinc-600">
          Global League · Ligen können später darauf aufgebaut werden.
        </p>
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      {leaderboard.length > 0 ? (
        <section className="grid gap-4 md:grid-cols-3">
          {leaderboard.slice(0, 3).map((entry) => (
            <div
              key={entry.user_id}
              className={`rounded-3xl border p-6 ${
                entry.is_current_user
                  ? "border-fuchsia-500/40 bg-fuchsia-500/10"
                  : "border-white/10 bg-[#101014]"
              }`}
            >
              <div className="flex items-center justify-between">
                {entry.rank === 1 ? (
                  <Crown
                    size={25}
                    className="text-yellow-400"
                  />
                ) : (
                  <Medal
                    size={23}
                    className="text-zinc-400"
                  />
                )}

                <span className="text-2xl font-bold text-zinc-600">
                  #{entry.rank}
                </span>
              </div>

              <p className="mt-5 text-lg font-semibold">
                {entry.display_name}
              </p>

              <p className="text-xs text-zinc-600">
                @{entry.username}
              </p>

              <p className="mt-5 text-2xl font-bold">
                {formatEur(entry.portfolio_value_eur)}
              </p>

              <p
                className={`mt-2 text-sm font-medium ${
                  entry.total_performance_eur >= 0
                    ? "text-emerald-400"
                    : "text-red-400"
                }`}
              >
                {formatPercent(
                  entry.total_performance_percent
                )}
              </p>
            </div>
          ))}
        </section>
      ) : null}

      <section>
        <h2 className="text-xl font-semibold">
          Gesamtwertung
        </h2>

        {leaderboard.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-white/10 bg-[#101014] p-6 text-sm text-zinc-500">
            Noch keine Ranglistendaten vorhanden.
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-[#101014]">
            {leaderboard.map((entry, index) => (
              <div
                key={entry.user_id}
                className={`grid gap-4 p-5 sm:grid-cols-[60px_1fr_1fr_1fr] sm:items-center ${
                  entry.is_current_user
                    ? "bg-fuchsia-500/10"
                    : ""
                } ${
                  index !== leaderboard.length - 1
                    ? "border-b border-white/5"
                    : ""
                }`}
              >
                <div className="text-xl font-bold text-zinc-500">
                  #{entry.rank}
                </div>

                <div>
                  <p className="font-semibold">
                    {entry.display_name}

                    {entry.is_current_user ? (
                      <span className="ml-2 text-xs text-fuchsia-400">
                        Du
                      </span>
                    ) : null}
                  </p>

                  <p className="mt-1 text-xs text-zinc-600">
                    @{entry.username}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-zinc-600">
                    Portfoliowert
                  </p>

                  <p className="mt-1 font-semibold">
                    {formatEur(entry.portfolio_value_eur)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-zinc-600">
                    Performance
                  </p>

                  <p
                    className={`mt-1 font-semibold ${
                      entry.total_performance_eur >= 0
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}
                  >
                    {formatPercent(
                      entry.total_performance_percent
                    )}
                  </p>

                  <p className="mt-1 text-xs text-zinc-600">
                    {entry.valued_at
                      ? `Stand ${new Date(
                          entry.valued_at
                        ).toLocaleString("de-DE")}`
                      : "Noch nicht live bewertet"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}