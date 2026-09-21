import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase =
    await createClient();

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      {
        error:
          "Nicht angemeldet.",
      },
      {
        status: 401,
      }
    );
  }

  const admin =
    createAdminClient();

  const {
    data: snapshots,
    error: snapshotError,
  } = await admin
    .from(
      "personal_leaderboard_snapshots"
    )
    .select(
      "user_id, league_key, portfolio_value_eur, cash_balance_eur, market_value_eur, total_performance_eur, total_performance_percent, valued_at"
    )
    .eq(
      "league_key",
      "global"
    )
    .order(
      "portfolio_value_eur",
      {
        ascending: false,
      }
    )
    .order(
      "total_performance_percent",
      {
        ascending: false,
      }
    );

  if (snapshotError) {
    return NextResponse.json(
      {
        error:
          "Rangliste konnte nicht geladen werden.",
      },
      {
        status: 500,
      }
    );
  }

  const snapshotRows =
    snapshots ?? [];

  const userIds =
    snapshotRows.map(
      (item) =>
        item.user_id
    );

  if (userIds.length === 0) {
    return NextResponse.json({
      leaderboard: [],
      current_user_rank:
        null,
      league:
        "global",
    });
  }

  const {
    data: profiles,
    error: profilesError,
  } = await admin
    .from("profiles")
    .select(
      "id, username, display_name"
    )
    .in(
      "id",
      userIds
    );

  if (profilesError) {
    return NextResponse.json(
      {
        error:
          "Nutzer konnten nicht geladen werden.",
      },
      {
        status: 500,
      }
    );
  }

  const profileMap =
    new Map(
      (profiles ?? []).map(
        (profile) => [
          profile.id,
          profile,
        ]
      )
    );

  const leaderboard =
    snapshotRows.map(
      (
        snapshot,
        index
      ) => {
        const profile =
          profileMap.get(
            snapshot.user_id
          );

        return {
          rank:
            index + 1,

          user_id:
            snapshot.user_id,

          username:
            profile?.username ??
            "user",

          display_name:
            profile?.display_name ??
            profile?.username ??
            "TradeVerse User",

          portfolio_value_eur:
            Number(
              snapshot.portfolio_value_eur
            ),

          cash_balance_eur:
            Number(
              snapshot.cash_balance_eur
            ),

          market_value_eur:
            Number(
              snapshot.market_value_eur
            ),

          total_performance_eur:
            Number(
              snapshot.total_performance_eur
            ),

          total_performance_percent:
            Number(
              snapshot.total_performance_percent
            ),

          valued_at:
            snapshot.valued_at,

          is_current_user:
            snapshot.user_id ===
            user.id,
        };
      }
    );

  const currentUser =
    leaderboard.find(
      (entry) =>
        entry.is_current_user
    );

  return NextResponse.json({
    leaderboard,

    current_user_rank:
      currentUser?.rank ??
      null,

    league:
      "global",
  });
}