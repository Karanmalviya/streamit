import { StreamProvider, StreamSource, StreamQuality } from './types';
import { ENV } from '../../config/env';

interface HDHubRawStream {
  name?: string;
  description?: string;
  url?: string;
  externalUrl?: string;
  behaviorHints?: {
    videoSize?: number;
    notWebReady?: boolean;
  };
}

const HDHUB_BASE =
  'https://hdhub.thevolecitor.qzz.io/eyJ0b3Jib3giOiJ1bnNldCIsInF1YWxpdGllcyI6IjIxNjBwLDEwODBwLDcyMHAiLCJzb3J0IjoiZGVzYyJ9/stream';

// Cache IMDb IDs to prevent redundant TMDB API lookups
const imdbIdCache: Record<string, string> = {};

async function getImdbId(
  tmdbId: number,
  type: 'movie' | 'tv' | 'anime' = 'movie'
): Promise<string | null> {
  const cacheKey = `${type}_${tmdbId}`;
  if (imdbIdCache[cacheKey]) {
    return imdbIdCache[cacheKey];
  }

  try {
    const tmdbType = type === 'tv' ? 'tv' : 'movie';
    const res = await fetch(
      `${ENV.TMDB_BASE_URL}/${tmdbType}/${tmdbId}/external_ids?api_key=${ENV.TMDB_API_KEY}`
    );
    const data = await res.json();
    if (data && data.imdb_id) {
      imdbIdCache[cacheKey] = data.imdb_id;
      return data.imdb_id;
    }
  } catch (err) {
    console.warn('Failed to fetch IMDb ID from TMDB:', err);
  }
  return null;
}

export const HDHubStreamProvider: StreamProvider = {
  id: 'hdhub_provider',
  name: 'HDHub Direct CDN Streams',
  enabled: true,

  search: async query => {
    try {
      if (!query.tmdbId) {
        return [];
      }

      const imdbId = await getImdbId(query.tmdbId, query.type);
      if (!imdbId) {
        return [];
      }

      let apiUrl = '';
      if (query.type === 'tv') {
        const season = query.season || 1;
        const episode = query.episode || 1;
        apiUrl = `${HDHUB_BASE}/series/${imdbId}:${season}:${episode}.json`;
      } else {
        apiUrl = `${HDHUB_BASE}/movie/${imdbId}.json`;
      }

      const response = await fetch(apiUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      if (!data || !Array.isArray(data.streams)) {
        return [];
      }

      const sources: StreamSource[] = [];

      for (let i = 0; i < data.streams.length; i++) {
        const s: HDHubRawStream = data.streams[i];
        if (!s.url || !s.url.startsWith('http')) {
          continue;
        }

        const text = ((s.name || '') + ' ' + (s.description || '')).toLowerCase();

        // Skip non-video / donation / announcement prompts
        if (
          text.includes('donation') ||
          text.includes('donate') ||
          text.includes('notice') ||
          text.includes('star needed') ||
          text.includes('maintenance')
        ) {
          continue;
        }

        // Quality detection
        let quality: StreamQuality = '1080p';
        if (text.includes('2160p') || text.includes('4k')) {
          quality = '4K';
        } else if (text.includes('720p')) {
          quality = '720p';
        } else if (text.includes('480p')) {
          quality = '480p';
        }

        // Host source identification
        let host = 'Direct Fast';
        if (text.includes('pixeldrain') || s.url.includes('pixeldrain')) {
          host = 'PixelDrain High Speed';
        } else if (text.includes('hubcloud') || s.url.includes('hubcloud')) {
          host = 'HubCloud Fast CDN';
        } else if (s.url.includes('bunker.monster')) {
          host = 'Bunker CDN';
        } else if (s.url.includes('cloudflarestorage.com')) {
          host = 'R2 Cloud Stream';
        }

        // Audio track info
        let audioTag = '';
        if (text.includes('hindi') && text.includes('english')) {
          audioTag = ' • Dual Audio (Hin/Eng)';
        } else if (text.includes('hindi')) {
          audioTag = ' • Hindi Audio';
        } else if (text.includes('english')) {
          audioTag = ' • English Audio';
        }

        // Parse file size
        const sizeMatch = (s.description || '').match(/\[💾\s*([^\]]+)\]/);
        const sizeStr = sizeMatch
          ? sizeMatch[1].trim()
          : s.behaviorHints?.videoSize
          ? Math.round(s.behaviorHints.videoSize / (1024 * 1024)) + ' MB'
          : undefined;

        sources.push({
          id: `hdhub_${i}_${imdbId}`,
          name: `HDHub ${quality} (${host})${audioTag}`,
          quality,
          url: s.url,
          format: 'mp4',
          size: sizeStr,
          resolution:
            quality === '4K'
              ? '3840x2160'
              : quality === '720p'
              ? '1280x720'
              : '1920x1080',
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
          },
        });
      }

      // Prioritize working CDN hosts (PixelDrain, HubCloud, Bunker CDN)
      return sources.sort((a, b) => {
        const getHostScore = (name: string) => {
          if (name.includes('PixelDrain')) return 30;
          if (name.includes('HubCloud')) return 20;
          if (name.includes('Bunker')) return 10;
          return 0;
        };
        return getHostScore(b.name) - getHostScore(a.name);
      });
    } catch (err) {
      console.warn('HDHub provider search error:', err);
      return [];
    }
  },
};
