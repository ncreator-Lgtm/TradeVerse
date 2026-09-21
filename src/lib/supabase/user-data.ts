import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

export type Profile = {
  id: string;
  username: string;
  display_name: string;
  created_at?: string;
};

export type PersonalPortfolio = {
  id: string;
  user_id: string;
  starting_capital: number | string;
  cash_balance: number | string;
  created_at?: string;
};

const STARTING_CASH = 100000;

function metadataProfile(user: User): Pick<Profile, "username" | "display_name"> {
  const metadata = user.user_metadata ?? {};
  const username =
    typeof metadata.username === "string" && metadata.username
      ? metadata.username
      : (user.email?.split("@")[0] ?? "trader");
  const displayName =
    typeof metadata.display_name === "string" && metadata.display_name
      ? metadata.display_name
      : username;

  return { username, display_name: displayName };
}

export async function ensureProfileAndPortfolio(
  supabase: SupabaseClient,
  user: User,
) {
  const meta = metadataProfile(user);

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name, created_at")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    await supabase.from("profiles").insert({
      id: user.id,
      username: meta.username,
      display_name: meta.display_name,
    });
  }

  const { data: portfolio } = await supabase
    .from("personal_portfolios")
    .select("id, user_id, starting_capital, cash_balance, created_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!portfolio) {
    await supabase.from("personal_portfolios").insert({
      user_id: user.id,
      starting_capital: STARTING_CASH,
      cash_balance: STARTING_CASH,
    });
  }
}

export async function getProfileAndPortfolio(
  supabase: SupabaseClient,
  userId: string,
) {
  const [profileResult, portfolioResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, username, display_name, created_at")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("personal_portfolios")
      .select("id, user_id, starting_capital, cash_balance, created_at")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  return {
    profile: (profileResult.data as Profile | null) ?? null,
    portfolio: (portfolioResult.data as PersonalPortfolio | null) ?? null,
    profileError: profileResult.error?.message,
    portfolioError: portfolioResult.error?.message,
  };
}
