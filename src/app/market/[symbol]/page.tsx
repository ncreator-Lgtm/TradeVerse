import { redirect } from "next/navigation";

import AppShell from "@/components/app-shell";
import MarketInstrument from "@/components/market-instrument";
import { createClient } from "@/lib/supabase/server";

export default async function InstrumentPage({
  params,
  searchParams,
}: {
  params: Promise<{
    symbol: string;
  }>;

  searchParams: Promise<{
    exchange?: string;
    name?: string;
    currency?: string;
  }>;
}) {
  const { symbol } = await params;

  const query =
    await searchParams;

  const supabase =
    await createClient();

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <AppShell>
      <MarketInstrument
        symbol={decodeURIComponent(
          symbol
        )}
        exchange={query.exchange}
        instrumentName={query.name}
        initialCurrency={
          query.currency
        }
      />
    </AppShell>
  );
}