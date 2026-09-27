export type StreamQuality = '4K' | '1080p' | '720p' | '480p' | 'Auto';

export interface SubtitleTrack {
  id: string;
  title: string;
  language: string;
  uri: string;
  type?: 'text/vtt' | 'application/x-subrip';
}

export interface StreamSource {
  id: string;
  name: string;
  quality: StreamQuality;
  url: string;
  format: 'mp4' | 'hls' | 'dash' | 'embed';
  headers?: Record<string, string>;
  subtitles?: SubtitleTrack[];
  resolution?: string;
  bitrate?: number;
  size?: string;
}

export interface StreamProvider {
  id: string;
  name: string;
  enabled: boolean;
  search: (query: {
    title: string;
    year?: string | number;
    type?: 'movie' | 'tv' | 'anime';
    season?: number;
    episode?: number;
    tmdbId?: number;
  }) => Promise<StreamSource[]>;
}
