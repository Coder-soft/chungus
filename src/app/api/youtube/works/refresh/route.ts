import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
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
    const { id } = (body || {}) as { id?: number };
    if (!id || typeof id !== "number") {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const key = process.env.YOUTUBE_API_KEY;
    if (!key) return NextResponse.json({ error: "Server missing YOUTUBE_API_KEY" }, { status: 500 });

    const supabase = getClient();

    const { data: existing, error: selErr } = await supabase
      .from("youtube_works")
      .select("id, youtube_url")
      .eq("id", id)
      .single();
    if (selErr) return NextResponse.json({ error: selErr.message }, { status: 500 });
    if (!existing) return NextResponse.json({ error: "Work not found" }, { status: 404 });

    const vid = extractVideoId(existing.youtube_url);
    if (!vid) return NextResponse.json({ error: "Invalid YouTube URL on record" }, { status: 400 });

    const vApi = new URL("https://www.googleapis.com/youtube/v3/videos");
    vApi.searchParams.set("part", "snippet,statistics");
    vApi.searchParams.set("id", vid);
    vApi.searchParams.set("key", key);
    const vr = await fetch(vApi.toString(), { cache: "no-store" });
    const vj = await vr.json();
    if (!vr.ok) return NextResponse.json({ error: vj?.error?.message || "YouTube API error" }, { status: vr.status });
    const item = vj.items?.[0];
    if (!item) return NextResponse.json({ error: "Video not found" }, { status: 404 });
    const snippet = item.snippet || {};
    const statistics = item.statistics || {};
    const thumbnails = snippet.thumbnails || {};
    const bestThumb = thumbnails.maxres || thumbnails.standard || thumbnails.high || thumbnails.medium || thumbnails.default;

    // channel avatar
    let channelAvatarUrl = "";
    if (snippet.channelId) {
      const chApi = new URL("https://www.googleapis.com/youtube/v3/channels");
      chApi.searchParams.set("part", "snippet");
      chApi.searchParams.set("id", snippet.channelId);
      chApi.searchParams.set("key", key);
      const cr = await fetch(chApi.toString(), { cache: "no-store" });
      if (cr.ok) {
        const cj = await cr.json();
        const ch = cj.items?.[0];
        const cthumbs = ch?.snippet?.thumbnails || {};
        const best = cthumbs.high || cthumbs.medium || cthumbs.default;
        channelAvatarUrl = best?.url || "";
      }
    }

    const payload = {
      video_id: vid,
      video_title: snippet.title || null,
      channel_id: snippet.channelId || null,
      channel_title: snippet.channelTitle || null,
      channel_avatar_url: channelAvatarUrl,
      thumbnail_url: bestThumb?.url || null,
      view_count: Number(statistics.viewCount || 0),
    } as const;

    const { data: updated, error: updErr } = await supabase
      .from("youtube_works")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });
    return NextResponse.json({ success: true, data: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status: 500 });
  }
}
