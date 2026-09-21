import { redirect } from "next/navigation";

import AppShell from "@/components/app-shell";
import LeaderboardView from "@/components/leaderboard-view";
import { createClient } from "@/lib/supabase/server";

export default async function LeaderboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <AppShell>
      <LeaderboardView />
    </AppShell>
  );
}