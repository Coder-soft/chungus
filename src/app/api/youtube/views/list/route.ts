import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const workId = url.searchParams.get("work_id");
    const videoId = url.searchParams.get("video_id");
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 20), 1), 200);

    if (!workId && !videoId) {
      return NextResponse.json({ error: "work_id or video_id is required" }, { status: 400 });
    }

    const supabase = getClient();
    let q = supabase
      .from("youtube_view_logs")
      .select("id, work_id, video_id, youtube_url, view_count, fetched_at")
      .order("fetched_at", { ascending: false })
      .limit(limit);

    if (workId) q = q.eq("work_id", Number(workId));
    if (videoId) q = q.eq("video_id", videoId);

    const { data, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, data });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
