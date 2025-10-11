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


export async function GET() {
  try {
    const supabase = getClient();
    const { data, error } = await supabase
      .from("youtube_works")
      .select("id, youtube_url, note, created_at, video_id, video_title, channel_id, channel_title, channel_avatar_url, thumbnail_url, view_count")
      .order("created_at", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(
      { success: true, data },
      {
        headers: {
          // Cache on edge/CDN for 60s, allow stale for 5min while revalidating
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { youtube_url, note, preview } = body || {} as { youtube_url: string; note?: string; preview?: Record<string, unknown> };
    if (!youtube_url || typeof youtube_url !== "string") {
      return NextResponse.json({ error: "youtube_url is required" }, { status: 400 });
    }

    // Use provided preview payload or fetch it from our preview endpoint
    let meta = preview;
    if (!meta) {
      const key = process.env.YOUTUBE_API_KEY;
      if (!key) return NextResponse.json({ error: "Server missing YOUTUBE_API_KEY" }, { status: 500 });
      const vid = extractVideoId(youtube_url);
      if (!vid) return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });

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

      meta = {
        video_id: vid,
        video_title: snippet.title || "",
        channel_id: snippet.channelId || "",
        channel_title: snippet.channelTitle || "",
        channel_avatar_url: channelAvatarUrl,
        thumbnail_url: bestThumb?.url || "",
        view_count: Number(statistics.viewCount || 0),
        youtube_url,
      };
    }

    const supabase = getClient();

    // Upsert by video_id to avoid duplicates
    const payload = {
      youtube_url,
      note: note ?? "",
      video_id: meta.video_id ?? null,
      video_title: meta.video_title ?? null,
      channel_id: meta.channel_id ?? null,
      channel_title: meta.channel_title ?? null,
      channel_avatar_url: meta.channel_avatar_url ?? "",
      thumbnail_url: meta.thumbnail_url ?? null,
      view_count: typeof meta.view_count === "number" ? meta.view_count : Number(meta.view_count || 0),
    };

    const { data, error } = await supabase
      .from("youtube_works")
      .upsert(payload, { onConflict: "video_id" })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
