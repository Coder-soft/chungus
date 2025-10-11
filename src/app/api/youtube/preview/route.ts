import { NextResponse } from "next/server";

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
      // shorts or embed
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
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "url is required" }, { status: 400 });
    }
    const videoId = extractVideoId(url);
    if (!videoId) {
      return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });
    }

    const key = process.env.YOUTUBE_API_KEY;
    if (!key) {
      return NextResponse.json({ error: "Server missing YOUTUBE_API_KEY" }, { status: 500 });
    }

    const api = new URL("https://www.googleapis.com/youtube/v3/videos");
    api.searchParams.set("part", "snippet,statistics");
    api.searchParams.set("id", videoId);
    api.searchParams.set("key", key);

    const r = await fetch(api.toString(), { cache: "no-store" });
    const j = await r.json();
    if (!r.ok) {
      return NextResponse.json({ error: j?.error?.message || "YouTube API error" }, { status: r.status });
    }
    const item = j.items?.[0];
    if (!item) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const snippet = item.snippet || {};
    const statistics = item.statistics || {};
    const thumbnails = snippet.thumbnails || {};
    const bestThumb = thumbnails.maxres || thumbnails.standard || thumbnails.high || thumbnails.medium || thumbnails.default;

    // Fetch channel avatar via channels.list
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

    const data = {
      video_id: videoId as string,
      video_title: snippet.title || "",
      channel_id: snippet.channelId || "",
      channel_title: snippet.channelTitle || "",
      channel_avatar_url: channelAvatarUrl,
      thumbnail_url: bestThumb?.url || "",
      view_count: Number(statistics.viewCount || 0),
      youtube_url: url,
    };

    return NextResponse.json({ success: true, data });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
