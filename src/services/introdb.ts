import { ENV } from '../config/env';

export interface VideoSegment {
  start_sec: number;
  end_sec: number;
  start_ms: number;
  end_ms: number;
  confidence?: number;
  submission_count?: number;
  updated_at?: string;
}

export interface MediaSegments {
  imdb_id: string;
  media_type: 'movie' | 'tv';
  is_movie: boolean;
  season?: number;
  episode?: number;
  intro: VideoSegment | null;
  recap: VideoSegment | null;
  outro: VideoSegment | null;
  post_credits: VideoSegment | null;
}

export interface FetchSegmentsParams {
  tmdbId?: number;
  imdbId?: string;
  type?: 'movie' | 'tv' | 'anime';
  season?: number;
  episode?: number;
}

// In-memory cache for fast lookup
const segmentsCache = new Map<string, MediaSegments | null>();

/**
 * Resolves IMDb ID from TMDB ID if needed
 */
export async function resolveImdbId(
  tmdbId: number,
  type: 'movie' | 'tv' | 'anime' = 'movie'
): Promise<string | null> {
  try {
    const mediaType = type === 'tv' ? 'tv' : 'movie';
    const extUrl = `${ENV.TMDB_BASE_URL}/${mediaType}/${tmdbId}/external_ids?api_key=${ENV.TMDB_API_KEY}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(extUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      return data.imdb_id || null;
    }
  } catch (err) {
    console.warn('[IntroDB] Failed to resolve IMDb ID from TMDB:', err);
  }
  return null;
}

/**
 * Fetches intro, recap, outro, and post_credits segments from IntroDB API
 */
export async function fetchIntroSegments(
  params: FetchSegmentsParams
): Promise<MediaSegments | null> {
  const { tmdbId, type = 'movie', season = 1, episode = 1 } = params;
  let imdbId = params.imdbId;

  // 1. Resolve IMDb ID if only TMDB ID is available
  if (!imdbId && tmdbId) {
    imdbId = (await resolveImdbId(tmdbId, type)) || undefined;
  }

  if (!imdbId) {
    return null;
  }

  const isMovie = type === 'movie';
  const cacheKey = isMovie ? `${imdbId}_movie` : `${imdbId}_s${season}_e${episode}`;

  if (segmentsCache.has(cacheKey)) {
    return segmentsCache.get(cacheKey) || null;
  }

  try {
    const endpoint = isMovie
      ? `https://api.introdb.app/segments?imdb_id=${encodeURIComponent(imdbId)}&is_movie=true`
      : `https://api.introdb.app/segments?imdb_id=${encodeURIComponent(imdbId)}&season=${season}&episode=${episode}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(endpoint, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      segmentsCache.set(cacheKey, null);
      return null;
    }

    const data = await res.json();
    if (data && typeof data === 'object') {
      const result: MediaSegments = {
        imdb_id: data.imdb_id || imdbId,
        media_type: data.media_type || (isMovie ? 'movie' : 'tv'),
        is_movie: !!data.is_movie,
        season: data.season,
        episode: data.episode,
        intro: data.intro && typeof data.intro.start_sec === 'number' ? data.intro : null,
        recap: data.recap && typeof data.recap.start_sec === 'number' ? data.recap : null,
        outro: data.outro && typeof data.outro.start_sec === 'number' ? data.outro : null,
        post_credits: data.post_credits && typeof data.post_credits.start_sec === 'number' ? data.post_credits : null,
      };

      segmentsCache.set(cacheKey, result);
      console.log(`[IntroDB] Loaded segments for ${cacheKey}:`, {
        intro: result.intro ? `${result.intro.start_sec}s - ${result.intro.end_sec}s` : null,
        recap: result.recap ? `${result.recap.start_sec}s - ${result.recap.end_sec}s` : null,
        outro: result.outro ? `${result.outro.start_sec}s - ${result.outro.end_sec}s` : null,
      });
      return result;
    }
  } catch (err) {
    console.warn('[IntroDB] Error fetching segments:', err);
  }

  segmentsCache.set(cacheKey, null);
  return null;
}
