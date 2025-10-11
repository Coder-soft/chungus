import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    }
  );
}

function extractVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") {
      return u.pathname.split("/").filter(Boolean)[0] || null;
    }
    if (u.hostname.includes("youtube.com")) {
      if (u.pathname.startsWith("/watch")) {
        return u.searchParams.get("v");
      }
      const parts = u.pathname.split("/").filter(Boolean);
      const idx = parts.findIndex((p) => p === "shorts" || p === "embed");
      if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
    }
    return null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { work_id, video_id: rawVideoId, youtube_url: rawUrl } = (body || {}) as {
      work_id?: number;
      video_id?: string;
      youtube_url?: string;
    };

    const key = process.env.YOUTUBE_API_KEY;
    if (!key) return NextResponse.json({ error: "Server missing YOUTUBE_API_KEY" }, { status: 500 });

    const supabase = getClient();

    let workId: number | null = null;
    let videoId: string | null = rawVideoId || null;
    let youtubeUrl: string | null = rawUrl || null;

    if (work_id) {
      workId = work_id;
      const { data: w, error: wErr } = await supabase
        .from("youtube_works")
        .select("id, video_id, youtube_url")
        .eq("id", work_id)
        .single();
      if (wErr) return NextResponse.json({ error: wErr.message }, { status: 500 });
      if (!w) return NextResponse.json({ error: "Work not found" }, { status: 404 });
      videoId = videoId || w.video_id;
      youtubeUrl = youtubeUrl || w.youtube_url;
    }

    if (!videoId && youtubeUrl) {
      videoId = extractVideoId(youtubeUrl);
    }

    if (!videoId) {
      return NextResponse.json({ error: "video_id or youtube_url (resolvable) is required" }, { status: 400 });
    }

    const api = new URL("https://www.googleapis.com/youtube/v3/videos");
    api.searchParams.set("part", "statistics");
    api.searchParams.set("id", videoId);
    api.searchParams.set("key", key);

    const r = await fetch(api.toString(), { cache: "no-store" });
    const j = await r.json();
    if (!r.ok) {
      return NextResponse.json({ error: j?.error?.message || "YouTube API error" }, { status: r.status });
    }
    const item = j.items?.[0];
    if (!item) return NextResponse.json({ error: "Video not found" }, { status: 404 });

    const statistics = item.statistics || {};
    const viewCount = Number(statistics.viewCount || 0);

    const insertPayload = {
      work_id: workId,
      video_id: videoId,
      youtube_url: youtubeUrl,
      view_count: viewCount,
    } as const;

    const { data: logRow, error: insErr } = await supabase
      .from("youtube_view_logs")
      .insert(insertPayload)
      .select()
      .single();
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

    if (workId) {
      await supabase
        .from("youtube_works")
        .update({ view_count: viewCount })
        .eq("id", workId);
    }

    return NextResponse.json({ success: true, data: logRow });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status: 500 });
  }
}
