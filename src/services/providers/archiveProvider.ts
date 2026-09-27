import { StreamProvider, StreamSource } from './types';
import { fetchLiveSubtitles } from './openSubtitles';

export const ArchiveStreamProvider: StreamProvider = {
  id: 'archive_provider',
  name: 'Internet Archive (Full Movies)',
  enabled: true,
  search: async ({ title, year: _year, tmdbId, type }) => {
    try {
      const cleanTitle = title.replace(/[^a-zA-Z0-9 ]/g, '').trim();
      const url = `https://archive.org/advancedsearch.php?q=title:(${encodeURIComponent(
        cleanTitle
      )})+AND+mediatype:(movies)&fl[]=identifier,title,year,downloads&sort[]=downloads+desc&rows=5&output=json`;

      const searchRes = await fetch(url);
      if (!searchRes.ok) return [];

      const searchData = await searchRes.json();
      const docs = searchData.response?.docs || [];

      // Fetch live subtitles in parallel
      const liveSubtitlesPromise = fetchLiveSubtitles(tmdbId, type);

      const sources: StreamSource[] = [];

      for (const doc of docs) {
        if (!doc.identifier) continue;
        if (doc.identifier.toLowerCase().includes('trailer')) continue;

        try {
          const metaRes = await fetch(`https://archive.org/metadata/${doc.identifier}/files`);
          if (!metaRes.ok) continue;

          const metaData = await metaRes.json();
          const files: any[] = metaData.result || [];
          const mp4s = files.filter(f => f.name && f.name.endsWith('.mp4'));

          if (mp4s.length === 0) continue;

          // Sort by file size descending
          mp4s.sort((a, b) => (parseInt(b.size, 10) || 0) - (parseInt(a.size, 10) || 0));
          const bestFile = mp4s[0];
          const sizeBytes = parseInt(bestFile.size, 10) || 0;
          const sizeMb = sizeBytes / (1024 * 1024);

          // Only accept files > 80 MB (real feature-length video files)
          if (sizeMb >= 80) {
            const streamUrl = `https://archive.org/download/${doc.identifier}/${encodeURIComponent(
              bestFile.name
            )}`;

            const quality = sizeMb > 900 ? '1080p' : sizeMb > 400 ? '720p' : '480p';

            const subs = await liveSubtitlesPromise;

            sources.push({
              id: 'archive_' + doc.identifier,
              name: `Full Feature Film (${doc.title || title})`,
              quality,
              format: 'mp4',
              url: streamUrl,
              size: (sizeMb / 1024 >= 1 ? (sizeMb / 1024).toFixed(1) + ' GB' : Math.round(sizeMb) + ' MB'),
              resolution: quality === '1080p' ? '1920x1080' : '1280x720',
              subtitles: subs,
            });

            // Found best archive match, break out of search
            break;
          }
        } catch (fileErr) {
          console.warn('Archive metadata fetch error:', fileErr);
        }
      }

      return sources;
    } catch (err) {
      console.warn('ArchiveStreamProvider search error:', err);
      return [];
    }
  },
};
