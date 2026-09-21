import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("watchlist_items")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const body = await request.json();

  const symbol = String(body.symbol ?? "").trim();
  const instrumentName = String(body.instrument_name ?? "").trim();

  if (!symbol || !instrumentName) {
    return NextResponse.json(
      { error: "Wertpapierdaten fehlen." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("watchlist_items")
    .insert({
      user_id: user.id,
      symbol,
      instrument_name: instrumentName,
      exchange: body.exchange ?? null,
      mic_code: body.mic_code ?? null,
      instrument_type: body.instrument_type ?? null,
      currency: body.currency ?? null,
      country: body.country ?? null,
      isin: body.isin ?? null,
      figi: body.figi ?? null,
      wkn: body.wkn ?? null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Dieses Wertpapier ist bereits in deiner Watchlist." },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const body = await request.json();
  const id = String(body.id ?? "");

  if (!id) {
    return NextResponse.json({ error: "ID fehlt." }, { status: 400 });
  }

  const { error } = await supabase
    .from("watchlist_items")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}