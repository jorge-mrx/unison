"use server";

export type GeniusMatch = {
  title: string;
  artist: string;
  thumbnailUrl: string | null;
};

const GENIUS_BASE = "https://api.genius.com";

export async function searchSongByLyrics(lyrics: string): Promise<GeniusMatch | null> {
  const token = process.env.GENIUS_API_TOKEN;
  if (!token) return null;

  const lines = lyrics
    .split(/\r?\n/)
    .map((l) => l.replace(/\[.*?\]/g, "").trim())
    .filter((l) => l.length > 5 && !/^\{.*\}$/.test(l));

  const query = lines.slice(0, 3).join(" ").substring(0, 120).trim();
  if (!query) return null;

  try {
    const url = `${GENIUS_BASE}/search?q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) return null;

    const data = await res.json();
    const hits = data?.response?.hits;
    if (!Array.isArray(hits) || hits.length === 0) return null;

    const song = hits[0].result;
    return {
      title: song.title ?? "",
      artist: song.primary_artist?.name ?? "",
      thumbnailUrl: song.song_art_image_thumbnail_url ?? null,
    };
  } catch {
    return null;
  }
}
