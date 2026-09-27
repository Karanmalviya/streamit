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
      '4K': 4,
      '1080p': 3,
      '720p': 2,
      '480p': 1,
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
    // 1. Embed links first (VidLink default instant play)
    // 2. HDHub Direct CDN links (4K, 1080p PixelDrain/HubCloud high speed)
    // 3. Archive.org & test CDN
    return allSources.sort((a, b) => {
      const isHDHubA = a.id.startsWith('hdhub_') ? 30 : 0;
      const isHDHubB = b.id.startsWith('hdhub_') ? 30 : 0;
      const isEmbedA = a.format === 'embed' ? 20 : 0;
      const isEmbedB = b.format === 'embed' ? 20 : 0;
      const isFullA = a.id.startsWith('archive_') ? 10 : 0;
      const isFullB = b.id.startsWith('archive_') ? 10 : 0;

      const weightA = (qualityWeight[a.quality] || 0) + isEmbedA + isHDHubA + isFullA;
      const weightB = (qualityWeight[b.quality] || 0) + isEmbedB + isHDHubB + isFullB;
      return weightB - weightA;
    });
  }
}

export const providerManager = new ProviderManager();
