import { SubtitleTrack } from './types';
import { ENV } from '../../config/env';

const LANG_MAP: Record<string, string> = {
  eng: 'English',
  spa: 'Spanish',
  fre: 'French',
  fra: 'French',
  deu: 'German',
  ger: 'German',
  ita: 'Italian',
  por: 'Portuguese',
  pob: 'Portuguese (BR)',
  hin: 'Hindi',
  jpn: 'Japanese',
  kor: 'Korean',
  zho: 'Chinese',
  chi: 'Chinese',
  rus: 'Russian',
  ara: 'Arabic',
  tur: 'Turkish',
  pol: 'Polish',
  nld: 'Dutch',
  swe: 'Swedish',
};

export async function fetchLiveSubtitles(
  tmdbId?: number,
  type: 'movie' | 'tv' | 'anime' = 'movie',
  season = 1,
  episode = 1
): Promise<SubtitleTrack[]> {
  if (!tmdbId) return [];

  try {
    // 1. Resolve TMDB ID to IMDB ID
    const mediaType = type === 'tv' ? 'tv' : 'movie';
    const extUrl = `${ENV.TMDB_BASE_URL}/${mediaType}/${tmdbId}/external_ids?api_key=${ENV.TMDB_API_KEY}`;
    const extRes = await fetch(extUrl);
    if (!extRes.ok) return [];

    const extData = await extRes.json();
    const imdbId = extData.imdb_id;
    if (!imdbId) return [];

    // 2. Query OpenSubtitles API
    const subEndpoint =
      type === 'tv'
        ? `https://opensubtitles-v3.strem.io/subtitles/series/${imdbId}:${season}:${episode}.json`
        : `https://opensubtitles-v3.strem.io/subtitles/movie/${imdbId}.json`;

    const subRes = await fetch(subEndpoint);
    if (!subRes.ok) return [];

    const subData = await subRes.json();
    const list: any[] = subData.subtitles || [];

    const tracks: SubtitleTrack[] = [];
    const seenLangs = new Set<string>();

    for (const item of list) {
      if (!item.url || !item.lang) continue;
      if (!seenLangs.has(item.lang)) {
        seenLangs.add(item.lang);
        tracks.push({
          id: 'sub_' + item.lang + '_' + tracks.length,
          title: LANG_MAP[item.lang] || item.lang.toUpperCase(),
          language: item.lang.substring(0, 2),
          uri: item.url,
          type: 'text/vtt',
        });
      }
      if (tracks.length >= 12) break; // Limit to top 12 primary languages
    }

    return tracks;
  } catch (err) {
    console.warn('Failed to fetch OpenSubtitles:', err);
    return [];
  }
}
