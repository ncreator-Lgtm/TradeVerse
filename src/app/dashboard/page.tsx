import Link from "next/link";
import { redirect } from "next/navigation";

import {
  ArrowRight,
  BookOpen,
  Flame,
  Search,
  Star,
  Target,
  Trophy,
  Wallet,
  Zap,
} from "lucide-react";

import AppShell from "@/components/app-shell";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type QuestRow = {
  quest_key: string;
  completed: boolean;
  xp_reward: number;
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

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  /*
   * Ein Login/Aufruf pro Kalendertag zählt
   * für den täglichen Streak.
   */
  await supabase.rpc("record_daily_streak");

  const admin = createAdminClient();

  const [
    profileResult,
    portfolioResult,
    streakResult,
    progressResult,
    questResult,
    snapshotResult,
    leaderboardResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("username, display_name")
      .eq("id", user.id)
      .single(),

    supabase
      .from("personal_portfolios")
      .select("starting_capital, cash_balance")
      .eq("user_id", user.id)
      .single(),

    supabase
      .from("user_streaks")
      .select("current_streak, longest_streak")
      .eq("user_id", user.id)
      .maybeSingle(),

    supabase
      .from("user_progress")
      .select("total_xp")
      .eq("user_id", user.id)
      .maybeSingle(),

    supabase.rpc("get_today_quest_status"),

    admin
      .from("personal_leaderboard_snapshots")
      .select(
        "portfolio_value_eur, cash_balance_eur, market_value_eur, total_performance_eur, total_performance_percent, valued_at"
      )
      .eq("user_id", user.id)
      .maybeSingle(),

    admin
      .from("personal_leaderboard_snapshots")
      .select("user_id, portfolio_value_eur")
      .eq("league_key", "global")
      .order("portfolio_value_eur", {
        ascending: false,
      }),
  ]);

  const profile = profileResult.data;

  const displayName =
    profile?.display_name ||
    profile?.username ||
    "Trader";

  const cashBalance = Number(
    portfolioResult.data?.cash_balance ?? 100000
  );

  const startingCapital = Number(
    portfolioResult.data?.starting_capital ?? 100000
  );

  const snapshot = snapshotResult.data;

  const portfolioValue = Number(
    snapshot?.portfolio_value_eur ?? cashBalance
  );

  const marketValue = Number(
    snapshot?.market_value_eur ?? 0
  );

  const totalPerformance = Number(
    snapshot?.total_performance_eur ??
      portfolioValue - startingCapital
  );

  const totalPerformancePercent = Number(
    snapshot?.total_performance_percent ??
      (startingCapital > 0
        ? (totalPerformance / startingCapital) * 100
        : 0)
  );

  const currentStreak = Number(
    streakResult.data?.current_streak ?? 0
  );

  const longestStreak = Number(
    streakResult.data?.longest_streak ?? 0
  );

  const totalXp = Number(
    progressResult.data?.total_xp ?? 0
  );

  const level =
    Math.floor(totalXp / 100) + 1;

  const xpInLevel =
    totalXp % 100;

  const xpProgress =
    Math.min(100, xpInLevel);

  const quests =
    (questResult.data ?? []) as QuestRow[];

  const questMap = new Map(
    quests.map((quest) => [
      quest.quest_key,
      quest,
    ])
  );

  const dailyQuests = [
    {
      key: "lesson_complete",
      title: "Eine Lektion abschließen",
      description:
        "Lerne heute etwas Neues in TradeVerse.",
      href: "/learn",
      icon: BookOpen,
      reward: 20,
    },
    {
      key: "portfolio_view",
      title: "Portfolio prüfen",
      description:
        "Öffne dein Portfolio und prüfe deine Positionen.",
      href: "/portfolio",
      icon: Wallet,
      reward: 10,
    },
    {
      key: "competition_view",
      title: "Wettbewerbe ansehen",
      description:
        "Sieh dir die aktuellen Wettbewerbe an.",
      href: "/competitions",
      icon: Trophy,
      reward: 10,
    },
  ];

  const completedQuests =
    dailyQuests.filter(
      (quest) =>
        questMap.get(quest.key)?.completed
    ).length;

  const leaderboardRows =
    leaderboardResult.data ?? [];

  const rankIndex =
    leaderboardRows.findIndex(
      (entry) =>
        entry.user_id === user.id
    );

  const rank =
    rankIndex >= 0
      ? rankIndex + 1
      : null;

  const hasErrors =
    profileResult.error ||
    portfolioResult.error ||
    streakResult.error ||
    progressResult.error ||
    questResult.error ||
    snapshotResult.error ||
    leaderboardResult.error;

  return (
    <AppShell>
      <div className="space-y-8">
        {/* HEADER */}
        <section>
          <p className="text-sm font-medium text-fuchsia-400">
            TradeVerse Dashboard
          </p>

          <h1 className="mt-1 text-3xl font-bold md:text-4xl">
            Willkommen zurück, {displayName}
          </h1>

          <p className="mt-2 text-sm text-zinc-400">
            Hier siehst du deinen aktuellen Fortschritt,
            dein Portfolio und deine heutigen Aufgaben.
          </p>
        </section>

        {hasErrors ? (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-300">
            Einige TradeVerse-Daten konnten nicht vollständig geladen werden.
          </div>
        ) : null}

        {/* HAUPTKENNZAHLEN */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Link
            href="/portfolio"
            className="group rounded-3xl border border-fuchsia-500/20 bg-gradient-to-br from-fuchsia-500/10 via-[#101014] to-purple-500/5 p-6 transition hover:border-fuchsia-500/40"
          >
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-fuchsia-500/10 p-2 text-fuchsia-400">
                <Wallet size={20} />
              </div>

              <ArrowRight
                size={17}
                className="text-zinc-700 transition group-hover:translate-x-1 group-hover:text-fuchsia-400"
              />
            </div>

            <p className="mt-5 text-xs text-zinc-500">
              Portfoliowert
            </p>

            <p className="mt-2 text-2xl font-bold">
              {formatEur(portfolioValue)}
            </p>

            <p
              className={`mt-2 text-sm font-medium ${
                totalPerformance >= 0
                  ? "text-emerald-400"
                  : "text-red-400"
              }`}
            >
              {formatPercent(
                totalPerformancePercent
              )}
            </p>
          </Link>

          <div className="rounded-3xl border border-white/10 bg-[#101014] p-6">
            <div className="rounded-xl bg-white/5 p-2 text-zinc-400 w-fit">
              <Wallet size={20} />
            </div>

            <p className="mt-5 text-xs text-zinc-500">
              Verfügbares Cash
            </p>

            <p className="mt-2 text-2xl font-bold">
              {formatEur(cashBalance)}
            </p>

            <p className="mt-2 text-xs text-zinc-600">
              Investiert:{" "}
              {formatEur(marketValue)}
            </p>
          </div>

          <Link
            href="/leaderboard"
            className="group rounded-3xl border border-white/10 bg-[#101014] p-6 transition hover:border-fuchsia-500/30"
          >
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-yellow-500/10 p-2 text-yellow-400">
                <Trophy size={20} />
              </div>

              <ArrowRight
                size={17}
                className="text-zinc-700 transition group-hover:translate-x-1 group-hover:text-fuchsia-400"
              />
            </div>

            <p className="mt-5 text-xs text-zinc-500">
              Globaler Rang
            </p>

            <p className="mt-2 text-2xl font-bold">
              {rank ? `#${rank}` : "—"}
            </p>

            <p className="mt-2 text-xs text-zinc-600">
              Global League
            </p>
          </Link>

          <div className="rounded-3xl border border-white/10 bg-[#101014] p-6">
            <div className="rounded-xl bg-orange-500/10 p-2 text-orange-400 w-fit">
              <Flame size={20} />
            </div>

            <p className="mt-5 text-xs text-zinc-500">
              Daily Streak
            </p>

            <p className="mt-2 text-2xl font-bold">
              {currentStreak}{" "}
              {currentStreak === 1
                ? "Tag"
                : "Tage"}
            </p>

            <p className="mt-2 text-xs text-zinc-600">
              Rekord: {longestStreak}{" "}
              {longestStreak === 1
                ? "Tag"
                : "Tage"}
            </p>
          </div>
        </section>

        {/* LEVEL + QUICK ACTIONS */}
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-[#101014] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">
                  Dein Level
                </p>

                <p className="mt-1 text-3xl font-bold">
                  Level {level}
                </p>
              </div>

              <div className="rounded-2xl bg-purple-500/10 p-3 text-purple-400">
                <Zap size={24} />
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500">
                  {xpInLevel} / 100 XP
                </span>

                <span className="text-fuchsia-400">
                  {totalXp} XP gesamt
                </span>
              </div>

              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-purple-600 to-pink-500"
                  style={{
                    width: `${xpProgress}%`,
                  }}
                />
              </div>
            </div>

            <Link
              href="/learn"
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-fuchsia-400 transition hover:text-fuchsia-300"
            >
              Weiterlernen
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#101014] p-6">
            <p className="text-sm text-zinc-500">
              Schnellzugriff
            </p>

            <h2 className="mt-1 text-xl font-semibold">
              Was möchtest du tun?
            </h2>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Link
                href="/market"
                className="flex items-center gap-3 rounded-2xl border border-white/5 bg-black/30 p-4 transition hover:border-fuchsia-500/20"
              >
                <Search className="text-fuchsia-400" size={20} />

                <div>
                  <p className="text-sm font-medium">
                    Märkte
                  </p>

                  <p className="text-xs text-zinc-600">
                    Wertpapier suchen
                  </p>
                </div>
              </Link>

              <Link
                href="/watchlist"
                className="flex items-center gap-3 rounded-2xl border border-white/5 bg-black/30 p-4 transition hover:border-fuchsia-500/20"
              >
                <Star className="text-yellow-400" size={20} />

                <div>
                  <p className="text-sm font-medium">
                    Watchlist
                  </p>

                  <p className="text-xs text-zinc-600">
                    Favoriten ansehen
                  </p>
                </div>
              </Link>

              <Link
                href="/portfolio"
                className="flex items-center gap-3 rounded-2xl border border-white/5 bg-black/30 p-4 transition hover:border-fuchsia-500/20"
              >
                <Wallet className="text-emerald-400" size={20} />

                <div>
                  <p className="text-sm font-medium">
                    Portfolio
                  </p>

                  <p className="text-xs text-zinc-600">
                    Positionen prüfen
                  </p>
                </div>
              </Link>

              <Link
                href="/leaderboard"
                className="flex items-center gap-3 rounded-2xl border border-white/5 bg-black/30 p-4 transition hover:border-fuchsia-500/20"
              >
                <Trophy className="text-purple-400" size={20} />

                <div>
                  <p className="text-sm font-medium">
                    Rangliste
                  </p>

                  <p className="text-xs text-zinc-600">
                    Ranking ansehen
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* DAILY QUESTS */}
        <section>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Target
                  size={20}
                  className="text-fuchsia-400"
                />

                <h2 className="text-xl font-semibold">
                  Tägliche Quests
                </h2>
              </div>

              <p className="mt-2 text-sm text-zinc-500">
                {completedQuests} von{" "}
                {dailyQuests.length} heute abgeschlossen
              </p>
            </div>

            <Link
              href="/quests"
              className="text-sm text-fuchsia-400 hover:text-fuchsia-300"
            >
              Alle Quests
            </Link>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {dailyQuests.map((quest) => {
              const Icon = quest.icon;

              const storedQuest =
                questMap.get(quest.key);

              const completed =
                storedQuest?.completed ??
                false;

              const reward =
                storedQuest?.xp_reward ??
                quest.reward;

              return (
                <Link
                  key={quest.key}
                  href={quest.href}
                  className={`group rounded-2xl border p-5 transition ${
                    completed
                      ? "border-emerald-500/20 bg-emerald-500/5"
                      : "border-white/10 bg-[#101014] hover:border-fuchsia-500/20"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div
                      className={`rounded-xl p-2 ${
                        completed
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-fuchsia-500/10 text-fuchsia-400"
                      }`}
                    >
                      <Icon size={19} />
                    </div>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs ${
                        completed
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-white/5 text-zinc-500"
                      }`}
                    >
                      {completed
                        ? "Erledigt"
                        : `+${reward} XP`}
                    </span>
                  </div>

                  <h3 className="mt-4 font-semibold">
                    {quest.title}
                  </h3>

                  <p className="mt-1 text-sm leading-5 text-zinc-500">
                    {quest.description}
                  </p>

                  {!completed ? (
                    <div className="mt-4 flex items-center gap-1 text-xs text-fuchsia-400">
                      Öffnen
                      <ArrowRight
                        size={14}
                        className="transition group-hover:translate-x-1"
                      />
                    </div>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </section>

        {/* PORTFOLIO INFO */}
        <section className="rounded-3xl border border-white/10 bg-[#101014] p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-zinc-500">
                Performance seit Start
              </p>

              <p
                className={`mt-2 text-2xl font-bold ${
                  totalPerformance >= 0
                    ? "text-emerald-400"
                    : "text-red-400"
                }`}
              >
                {totalPerformance >= 0
                  ? "+"
                  : ""}
                {formatEur(
                  totalPerformance
                )}
              </p>

              <p className="mt-2 text-xs text-zinc-600">
                Startkapital:{" "}
                {formatEur(
                  startingCapital
                )}
              </p>

              {snapshot?.valued_at ? (
                <p className="mt-1 text-xs text-zinc-700">
                  Letzte Bewertung:{" "}
                  {new Date(
                    snapshot.valued_at
                  ).toLocaleString(
                    "de-DE"
                  )}
                </p>
              ) : null}
            </div>

            <Link
              href="/portfolio"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/5 px-4 py-3 text-sm font-medium text-zinc-300 transition hover:bg-white/10"
            >
              Portfolio öffnen
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </div>
    </AppShell>
  );
}