import { redirect } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  Coins,
  Swords,
  Trophy,
  Zap,
} from "lucide-react";

import AppShell from "@/components/app-shell";
import { createClient } from "@/lib/supabase/server";

type QuestResult = {
  completed: boolean;
  xp_awarded: number;
  total_xp: number;
};

export default async function CompetitionsPage() {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) {
    redirect("/login");
  }

  const { data: questRows } = await supabase.rpc(
    "complete_daily_quest",
    {
      p_quest_key: "competition_view",
    }
  );

  const questResult =
    (questRows?.[0] ?? null) as QuestResult | null;

  return (
    <AppShell>
      <div className="relative">
        <div className="pointer-events-none absolute -top-24 right-1/4 h-72 w-72 rounded-full bg-fuchsia-500/10 blur-3xl" />

        <div className="relative">
          <p className="text-sm font-medium text-fuchsia-400">
            TradeVerse Arena
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight md:text-4xl">
            Wettbewerbe
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
            Tritt in zeitlich begrenzten Trading-Challenges gegen andere
            Spieler an.
          </p>
        </div>

        {questResult?.completed ? (
          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-300">
            <CheckCircle2 size={20} />

            <div>
              <p className="font-semibold">
                Tagesquest abgeschlossen
              </p>

              <p className="text-sm text-emerald-300/70">
                Wettbewerbe entdeckt · +{questResult.xp_awarded} XP
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-zinc-400">
            <CheckCircle2 size={20} />

            <p className="text-sm">
              Die Wettbewerbs-Quest wurde heute bereits abgeschlossen.
            </p>
          </div>
        )}

        <section className="mt-8">
          <h2 className="text-xl font-semibold">
            Kommende Challenges
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Vorschau auf das zukünftige Wettbewerbssystem
          </p>

          <div className="mt-4 grid gap-5 lg:grid-cols-3">
            <article className="relative overflow-hidden rounded-3xl border border-fuchsia-500/20 bg-[#101014] p-6">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-fuchsia-500 to-transparent" />

              <div className="flex items-center justify-between">
                <div className="rounded-xl bg-fuchsia-500/10 p-3 text-fuchsia-400">
                  <Coins size={23} />
                </div>

                <span className="rounded-full bg-fuchsia-500/10 px-3 py-1 text-xs font-medium text-fuchsia-300">
                  Bald
                </span>
              </div>

              <h3 className="mt-5 text-xl font-semibold">
                Crypto Only
              </h3>

              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Handle ausschließlich Kryptowährungen in einem zeitlich
                begrenzten Wettbewerb.
              </p>

              <div className="mt-6 space-y-3 text-sm">
                <div className="flex items-center gap-2 text-zinc-400">
                  <Clock size={16} />
                  Freitag bis Sonntag
                </div>

                <div className="flex items-center gap-2 text-zinc-400">
                  <Zap size={16} />
                  100.000 € virtuelles Startkapital
                </div>
              </div>
            </article>

            <article className="rounded-3xl border border-white/10 bg-[#101014] p-6">
              <div className="flex items-center justify-between">
                <div className="rounded-xl bg-purple-500/10 p-3 text-purple-400">
                  <Swords size={23} />
                </div>

                <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-zinc-500">
                  Geplant
                </span>
              </div>

              <h3 className="mt-5 text-xl font-semibold">
                Tech Challenge
              </h3>

              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Ein Wettbewerb mit ausgewählten Technologieaktien.
              </p>

              <div className="mt-6 flex items-center gap-2 text-sm text-zinc-400">
                <Trophy size={16} />
                Eigene Wettbewerbsrangliste
              </div>
            </article>

            <article className="rounded-3xl border border-white/10 bg-[#101014] p-6">
              <div className="flex items-center justify-between">
                <div className="rounded-xl bg-pink-500/10 p-3 text-pink-400">
                  <Trophy size={23} />
                </div>

                <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-zinc-500">
                  Geplant
                </span>
              </div>

              <h3 className="mt-5 text-xl font-semibold">
                ETF Challenge
              </h3>

              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Stelle dein bestes ETF-Portfolio innerhalb eines festen
                Zeitraums zusammen.
              </p>

              <div className="mt-6 flex items-center gap-2 text-sm text-zinc-400">
                <Zap size={16} />
                Gleiche Startbedingungen für alle
              </div>
            </article>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-[#101014] p-6">
          <h2 className="text-lg font-semibold">
            So funktionieren Wettbewerbe
          </h2>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-500">
            Jeder Wettbewerb bekommt ein separates virtuelles Portfolio.
            Gewinne und Verluste beeinflussen dein persönliches Portfolio
            dadurch nicht.
          </p>
        </section>
      </div>
    </AppShell>
  );
}