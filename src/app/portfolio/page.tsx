import { redirect } from "next/navigation";

import AppShell from "@/components/app-shell";
import PortfolioOverview from "@/components/portfolio-overview";
import { createClient } from "@/lib/supabase/server";

export default async function PortfolioPage() {
  const supabase =
    await createClient();

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  /*
   * Portfolio-Aufruf zählt weiterhin
   * für die tägliche Portfolio-Quest.
   */
  await supabase.rpc(
    "complete_daily_quest",
    {
      p_quest_key:
        "portfolio_view",
    }
  );

  return (
    <AppShell>
      <PortfolioOverview />
    </AppShell>
  );
}