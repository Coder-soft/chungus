import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

export async function GET() {
  try {
    const supabase = getClient();
    const { data, error } = await supabase.rpc("youtube_total_views");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const total = typeof data === "number" ? data : Number(data || 0);
    return NextResponse.json({ success: true, data: total });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
