import { StreamProvider, StreamSource } from './types';
import { MultiEmbedProvider } from './embedProvider';
import { HDHubStreamProvider } from './hdhubProvider';



export * from './types';
export * from './openSubtitles';

export * from './embedProvider';
export * from './hdhubProvider';

class ProviderManager {
  private providers: StreamProvider[] = [
    MultiEmbedProvider,
    HDHubStreamProvider,


  ];

  public registerProvider(provider: StreamProvider) {
    this.providers.push(provider);
  }

  public async getStreams(query: {
    title: string;
    year?: string | number;
    type?: 'movie' | 'tv' | 'anime';
    season?: number;
    episode?: number;
    tmdbId?: number;
  }): Promise<StreamSource[]> {
    const qualityWeight: Record<string, number> = {
      '720p': 100,
      '1080p': 50,
      '480p': 20,
      '4K': -50,
      Auto: 0,
    };

    const activeProviders = this.providers.filter(p => p.enabled);

    const results = await Promise.allSettled(
      activeProviders.map(provider =>
        Promise.race([
          provider.search(query),
          new Promise<StreamSource[]>((_, reject) =>
            setTimeout(() => reject(new Error('Timeout on ' + provider.name)), 9000)
          ),
        ])
      )
    );

    const allSources: StreamSource[] = [];

    for (const result of results) {
      if (result.status === 'fulfilled') {
        allSources.push(...result.value);
      } else {
        console.warn('Provider search failed:', result.reason);
      }
    }

    // Sort streams:
    // 1. Native Direct Streams (HDHub Direct CDN, PixelDrain/HubCloud MP4/HLS) - highest priority
    // 2. 720p default quality tier highest
    // 3. Direct format streams (format !== 'embed')
    // 4. Embed fallback links (VidLink, AutoEmbed, etc.)
    return allSources.sort((a, b) => {
      const isNativeA = a.format !== 'embed' ? 40 : 0;
      const isNativeB = b.format !== 'embed' ? 40 : 0;
      const isHDHubA = a.id.startsWith('hdhub_') ? 20 : 0;
      const isHDHubB = b.id.startsWith('hdhub_') ? 20 : 0;

      const weightA = (qualityWeight[a.quality] || 0) + isNativeA + isHDHubA;
      const weightB = (qualityWeight[b.quality] || 0) + isNativeB + isHDHubB;
      return weightB - weightA;
    });
  }
}

export function getPreferred720pSource(sources: StreamSource[]): StreamSource | undefined {
  if (!sources || sources.length === 0) return undefined;
  const native = sources.filter(s => s.format !== 'embed');
  const pool = native.length > 0 ? native : sources;

  // 1. Prioritize 720p
  const s720 = pool.find(s =>
    s.quality?.toLowerCase().includes('720') ||
    s.name?.toLowerCase().includes('720')
  );
  if (s720) return s720;

  // 2. Fallback to 1080p
  const s1080 = pool.find(s =>
    s.quality?.toLowerCase().includes('1080') ||
    s.name?.toLowerCase().includes('1080')
  );
  if (s1080) return s1080;

  // 3. Fallback to 480p
  const s480 = pool.find(s =>
    s.quality?.toLowerCase().includes('480') ||
    s.name?.toLowerCase().includes('480') ||
    s.quality?.toLowerCase().includes('360')
  );
  if (s480) return s480;

  return pool[0];
}

export const providerManager = new ProviderManager();
