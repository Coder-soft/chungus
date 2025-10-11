export type ChannelRating = {
  id: number
  youtubeHandle: string
  channelName: string
  subscriberCount: number
  avatarUrl: string
  stars: number
  comment: string
  submittedAt: string
}

export type SubmitPayload = {
  youtubeHandle: string
  stars: number
  comment: string
}

export function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE?.trim() || "https://youtube-channel-data-api-ecru.vercel.app";
}

export async function submitChannelRating(payload: SubmitPayload) {
  const res = await fetch(`${getApiBaseUrl()}/api/submit-channel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || 'Failed to submit');
  }
  return data as { success: boolean; data: ChannelRating };
}

export async function listChannelRatings() {
  const res = await fetch(`${getApiBaseUrl()}/api/channels`, { cache: 'no-store' });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || 'Failed to fetch');
  }
  return data as ChannelRating[];
}

export async function deleteChannelRating(id: number) {
  const res = await fetch(`${getApiBaseUrl()}/api/channels/${id}`, { method: 'DELETE', cache: 'no-store' });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || 'Failed to delete');
  }
  return data as { success: boolean; message: string; id: number };
}

export type YouTubeWork = {
  id: number
  youtube_url: string
  note: string
  created_at: string
  video_id: string | null
  video_title: string | null
  channel_id: string | null
  channel_title: string | null
  channel_avatar_url: string
  thumbnail_url: string | null
  view_count: number
}

export async function previewYouTube(url: string) {
  const res = await fetch(`/api/youtube/preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
    cache: 'no-store',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Preview failed');
  return data.data as {
    video_id: string
    video_title: string
    channel_id: string
    channel_title: string
    channel_avatar_url: string
    thumbnail_url: string
    view_count: number
    youtube_url: string
  };
}

export async function listYouTubeWorks() {
  const res = await fetch(`/api/youtube/works`);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Failed to load works');
  return data.data as YouTubeWork[];
}

export async function upsertYouTubeWork(args: { youtube_url: string; note?: string; preview?: any }) {
  const res = await fetch(`/api/youtube/works`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
    cache: 'no-store',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Failed to save work');
  return data.data as YouTubeWork;
}

export async function refreshYouTubeWork(id: number) {
  const res = await fetch(`/api/youtube/works/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
    cache: 'no-store',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Failed to refresh');
  return data.data as YouTubeWork;
}
