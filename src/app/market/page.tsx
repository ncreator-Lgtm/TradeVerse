import { redirect } from "next/navigation";

import AppShell from "@/components/app-shell";
import MarketSearch from "@/components/market-search";
import { createClient } from "@/lib/supabase/server";

export default async function MarketPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <AppShell>
      <div>
        <p className="text-sm font-medium text-fuchsia-400">
          TradeVerse Markets
        </p>

        <h1 className="mt-1 text-3xl font-bold md:text-4xl">
          Wertpapiere entdecken
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
          Suche nach Aktien und anderen verfügbaren Wertpapieren und speichere
          sie in deiner persönlichen Watchlist.
        </p>

        <div className="mt-8">
          <MarketSearch />
        </div>
      </div>
    </AppShell>
  );
}