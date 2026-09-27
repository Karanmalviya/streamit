import { StreamProvider, StreamSource } from './types';
import { fetchLiveSubtitles } from './openSubtitles';

export const MultiEmbedProvider: StreamProvider = {
  id: 'multi_embed_provider',
  name: 'Embed Streaming Servers',
  enabled: true,
  search: async ({ title: _title, tmdbId, type, season = 1, episode = 1 }) => {
    if (!tmdbId) return [];

    const isTv = type === 'tv';
    const liveSubs = await fetchLiveSubtitles(tmdbId, type, season, episode);

    const sources: StreamSource[] = [
      {
        id: 'embed_vidlink_' + tmdbId,
        name: 'VidLink (Ultra Fast HD)',
        quality: '1080p',
        format: 'embed',
        url: isTv
          ? `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}`
          : `https://vidlink.pro/movie/${tmdbId}`,
        size: '1080p Full Stream',
        resolution: '1920x1080',
        subtitles: liveSubs,
      },
      {
        id: 'embed_vidfast_' + tmdbId,
        name: 'VidFast Server',
        quality: '1080p',
        format: 'embed',
        url: isTv
          ? `https://vidfast.vc/tv/${tmdbId}/${season}/${episode}`
          : `https://vidfast.vc/movie/${tmdbId}`,
        size: '1080p',
        resolution: '1920x1080',
        subtitles: liveSubs,
      },
      {
        id: 'embed_vidlux_' + tmdbId,
        name: 'VidLux Server',
        quality: '1080p',
        format: 'embed',
        url: isTv
          ? `https://vidlux.xyz/embed/tv/${tmdbId}/${season}/${episode}`
          : `https://vidlux.xyz/embed/movie/${tmdbId}`,
        size: '1080p',
        resolution: '1920x1080',
        subtitles: liveSubs,
      },
      {
        id: 'embed_hexa_' + tmdbId,
        name: 'Hexa Stream',
        quality: '1080p',
        format: 'embed',
        url: isTv
          ? `https://hexa.su/embed/tv/${tmdbId}/${season}/${episode}`
          : `https://hexa.su/embed/movie/${tmdbId}`,
        size: '1080p',
        resolution: '1920x1080',
        subtitles: liveSubs,
      },
      {
        id: 'embed_vidrock_' + tmdbId,
        name: 'VidRock Server',
        quality: '1080p',
        format: 'embed',
        url: isTv
          ? `https://vidrock.net/embed/tv/${tmdbId}/${season}/${episode}`
          : `https://vidrock.net/embed/movie/${tmdbId}`,
        size: '1080p',
        resolution: '1920x1080',
        subtitles: liveSubs,
      },
      {
        id: 'embed_vidup_' + tmdbId,
        name: 'VidUp Server',
        quality: '1080p',
        format: 'embed',
        url: isTv
          ? `https://vidup.to/tv/${tmdbId}/${season}/${episode}`
          : `https://vidup.to/movie/${tmdbId}`,
        size: '1080p',
        resolution: '1920x1080',
        subtitles: liveSubs,
      },
      {
        id: 'embed_vidnest_' + tmdbId,
        name: 'VidNest Server',
        quality: '1080p',
        format: 'embed',
        url: isTv
          ? `https://vidnest.fun/tv/${tmdbId}/${season}/${episode}`
          : `https://vidnest.fun/movie/${tmdbId}`,
        size: '1080p',
        resolution: '1920x1080',
        subtitles: liveSubs,
      },
      {
        id: 'embed_vidcore_' + tmdbId,
        name: 'VidCore Stream',
        quality: '1080p',
        format: 'embed',
        url: isTv
          ? `https://vidcore.io/tv/${tmdbId}/${season}/${episode}`
          : `https://vidcore.io/movie/${tmdbId}`,
        size: '1080p',
        resolution: '1920x1080',
        subtitles: liveSubs,
      },
      {
        id: 'embed_vidzee_' + tmdbId,
        name: 'VidZee Player',
        quality: '1080p',
        format: 'embed',
        url: isTv
          ? `https://player.vidzee.wtf/embed/tv/${tmdbId}/${season}/${episode}`
          : `https://player.vidzee.wtf/embed/movie/${tmdbId}`,
        size: '1080p',
        resolution: '1920x1080',
        subtitles: liveSubs,
      },
      {
        id: 'embed_vidora_' + tmdbId,
        name: 'Vidora Stream',
        quality: '1080p',
        format: 'embed',
        url: isTv
          ? `https://vidora.su/embed/tv/${tmdbId}/${season}/${episode}`
          : `https://vidora.su/embed/movie/${tmdbId}`,
        size: '1080p',
        resolution: '1920x1080',
        subtitles: liveSubs,
      },
      {
        id: 'embed_vidlove_' + tmdbId,
        name: 'VidLove Player',
        quality: '1080p',
        format: 'embed',
        url: isTv
          ? `https://player.vidlove.cc/embed/tv/${tmdbId}/${season}/${episode}`
          : `https://player.vidlove.cc/embed/movie/${tmdbId}`,
        size: '1080p',
        resolution: '1920x1080',
        subtitles: liveSubs,
      },
      {
        id: 'embed_peachify_' + tmdbId,
        name: 'Peachify Server',
        quality: '1080p',
        format: 'embed',
        url: isTv
          ? `https://peachify.top/embed/tv/${tmdbId}/${season}/${episode}`
          : `https://peachify.top/embed/movie/${tmdbId}`,
        size: '1080p',
        resolution: '1920x1080',
        subtitles: liveSubs,
      },
      {
        id: 'embed_mapple_' + tmdbId,
        name: 'Mapple Watch',
        quality: '1080p',
        format: 'embed',
        url: isTv
          ? `https://mapple.uk/watch/tv/${tmdbId}/${season}/${episode}`
          : `https://mapple.uk/watch/movie/${tmdbId}`,
        size: '1080p',
        resolution: '1920x1080',
        subtitles: liveSubs,
      },
      {
        id: 'embed_vixsrc_' + tmdbId,
        name: 'VixSrc Stream',
        quality: '1080p',
        format: 'embed',
        url: isTv
          ? `https://vixsrc.to/tv/${tmdbId}/${season}/${episode}`
          : `https://vixsrc.to/movie/${tmdbId}`,
        size: '1080p',
        resolution: '1920x1080',
        subtitles: liveSubs,
      },
      {
        id: 'embed_vidsrcpm_' + tmdbId,
        name: 'VidSrc PM',
        quality: '1080p',
        format: 'embed',
        url: isTv
          ? `https://vidsrc.pm/embed/tv/${tmdbId}/${season}/${episode}`
          : `https://vidsrc.pm/embed/movie/${tmdbId}`,
        size: '1080p',
        resolution: '1920x1080',
        subtitles: liveSubs,
      },
      {
        id: 'embed_autoembed_' + tmdbId,
        name: 'AutoEmbed Server',
        quality: '720p',
        format: 'embed',
        url: isTv
          ? `https://autoembed.co/tv/tmdb/${tmdbId}-${season}-${episode}`
          : `https://autoembed.co/movie/tmdb/${tmdbId}`,
        size: '720p',
        resolution: '1280x720',
        subtitles: liveSubs,
      },
      {
        id: 'embed_2embed_' + tmdbId,
        name: '2Embed Server',
        quality: '720p',
        format: 'embed',
        url: isTv
          ? `https://www.2embed.cc/embedtv/${tmdbId}&s=${season}&e=${episode}`
          : `https://www.2embed.cc/embed/${tmdbId}`,
        size: '720p',
        resolution: '1280x720',
        subtitles: liveSubs,
      },
      {
        id: 'embed_2embed_skin_' + tmdbId,
        name: '2Embed Skin Mirror',
        quality: '720p',
        format: 'embed',
        url: isTv
          ? `https://www.2embed.skin/embedtv/${tmdbId}&s=${season}&e=${episode}`
          : `https://www.2embed.skin/embed/${tmdbId}`,
        size: '720p',
        resolution: '1280x720',
        subtitles: liveSubs,
      },
    ];

    return sources;
  },
};
