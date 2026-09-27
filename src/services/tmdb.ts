import { ENV } from '../config/env';

export interface MediaItem {
  id: number;
  title: string;
  originalTitle?: string;
  titleLogo?: string | null;
  trailerUrl?: string | null;
  trailerKey?: string | null;
  year: string;
  rating: number;
  voteCount: number;
  poster: string | null;
  backdrop: string | null;
  overview: string;
  language: string;
  genres: string[];
  type: 'movie' | 'tv' | 'anime';
}

const GENRE_MAP: Record<number, string> = {
  12: 'Adventure',
  14: 'Fantasy',
  16: 'Animation',
  18: 'Drama',
  27: 'Horror',
  28: 'Action',
  35: 'Comedy',
  36: 'History',
  37: 'Western',
  53: 'Thriller',
  80: 'Crime',
  99: 'Doc',
  878: 'Sci-Fi',
  9648: 'Mystery',
  10402: 'Music',
  10749: 'Romance',
  10751: 'Family',
  10752: 'War',
  10759: 'Action & Adv',
  10762: 'Kids',
  10763: 'News',
  10764: 'Reality',
  10765: 'Sci-Fi & Fantasy',
  10766: 'Soap',
  10767: 'Talk',
  10768: 'War & Politics',
  10770: 'TV Movie',
};

function formatItem(raw: any, type: 'movie' | 'tv' | 'anime'): MediaItem {
  const dateStr = raw.release_date || raw.first_air_date || '';
  const year = dateStr ? dateStr.substring(0, 4) : 'N/A';
  const genres = (raw.genre_ids || [])
    .map((id: number) => GENRE_MAP[id])
    .filter(Boolean)
    .slice(0, 3);

  const resolvedType =
    type ||
    (raw.media_type === 'tv'
      ? (raw.genre_ids?.includes(16) && raw.original_language === 'ja' ? 'anime' : 'tv')
      : 'movie');

  return {
    id: raw.id,
    title: raw.title || raw.name || raw.original_title || raw.original_name || 'Untitled',
    originalTitle: raw.original_title || raw.original_name,
    year,
    rating: typeof raw.vote_average === 'number' ? Number(raw.vote_average.toFixed(1)) : 0,
    voteCount: raw.vote_count || 0,
    poster: raw.poster_path ? `${ENV.TMDB_IMAGE_BASE_URL}/w500${raw.poster_path}` : null,
    backdrop: raw.backdrop_path
      ? `${ENV.TMDB_IMAGE_BASE_URL}/w1280${raw.backdrop_path}`
      : raw.poster_path
      ? `${ENV.TMDB_IMAGE_BASE_URL}/w780${raw.poster_path}`
      : null,
    overview: raw.overview || 'No synopsis available.',
    language: (raw.original_language || 'en').toUpperCase(),
    genres,
    type: resolvedType,
  };
}

const TMDB_MIRRORS = [
  'https://api.tmdb.org/3',
  'https://api.themoviedb.org/3',
];

async function tmdbFetch(endpoint: string): Promise<any> {
  let lastErr: any = null;
  for (const base of TMDB_MIRRORS) {
    try {
      const url = endpoint.startsWith('http') ? endpoint : `${base}${endpoint}`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 9000);
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error(`All TMDB mirrors failed for ${endpoint}`);
}

export type CategoryFilter = 'trending' | 'popular' | 'top_rated' | 'extra';

export async function fetchCategoryItems(
  type: 'movie' | 'tv' | 'anime',
  subCategory: CategoryFilter = 'trending',
  page = 1
): Promise<MediaItem[]> {
  let endpoint = '';

  if (type === 'movie') {
    switch (subCategory) {
      case 'trending':
        endpoint = `/trending/movie/day?api_key=${ENV.TMDB_API_KEY}&page=${page}`;
        break;
      case 'popular':
        endpoint = `/movie/popular?api_key=${ENV.TMDB_API_KEY}&page=${page}&language=en-US`;
        break;
      case 'top_rated':
        endpoint = `/movie/top_rated?api_key=${ENV.TMDB_API_KEY}&page=${page}&language=en-US`;
        break;
      case 'extra':
        endpoint = `/movie/now_playing?api_key=${ENV.TMDB_API_KEY}&page=${page}&language=en-US`;
        break;
    }
  } else if (type === 'tv') {
    switch (subCategory) {
      case 'trending':
        endpoint = `/trending/tv/day?api_key=${ENV.TMDB_API_KEY}&page=${page}`;
        break;
      case 'popular':
        endpoint = `/tv/popular?api_key=${ENV.TMDB_API_KEY}&page=${page}&language=en-US`;
        break;
      case 'top_rated':
        endpoint = `/tv/top_rated?api_key=${ENV.TMDB_API_KEY}&page=${page}&language=en-US`;
        break;
      case 'extra':
        endpoint = `/tv/on_the_air?api_key=${ENV.TMDB_API_KEY}&page=${page}&language=en-US`;
        break;
    }
  } else {
    // Anime
    switch (subCategory) {
      case 'trending':
        endpoint = `/discover/tv?api_key=${ENV.TMDB_API_KEY}&with_genres=16&with_original_language=ja&sort_by=popularity.desc&page=${page}`;
        break;
      case 'popular':
        endpoint = `/discover/tv?api_key=${ENV.TMDB_API_KEY}&with_genres=16&with_original_language=ja&sort_by=popularity.desc&page=${page}`;
        break;
      case 'top_rated':
        endpoint = `/discover/tv?api_key=${ENV.TMDB_API_KEY}&with_genres=16&with_original_language=ja&sort_by=vote_average.desc&vote_count.gte=100&page=${page}`;
        break;
      case 'extra':
        endpoint = `/discover/movie?api_key=${ENV.TMDB_API_KEY}&with_genres=16&with_original_language=ja&sort_by=popularity.desc&page=${page}`;
        break;
    }
  }

  try {
    const data = await tmdbFetch(endpoint);
    const items = (data.results || []).map((item: any) => formatItem(item, type));
    if (items.length === 0 && page === 1) {
      if (type === 'movie') return FALLBACK_POPULAR_MOVIES;
      if (type === 'tv') return FALLBACK_POPULAR_TV;
      return FALLBACK_POPULAR_ANIME;
    }
    return items;
  } catch (err) {
    console.warn(`Failed to fetch category items for ${type}/${subCategory}:`, err);
    if (type === 'movie') return FALLBACK_POPULAR_MOVIES;
    if (type === 'tv') return FALLBACK_POPULAR_TV;
    return FALLBACK_POPULAR_ANIME;
  }
}

const FALLBACK_POPULAR_MOVIES: MediaItem[] = [
  {
    id: 872585,
    title: 'Oppenheimer',
    originalTitle: 'Oppenheimer',
    year: '2023',
    rating: 8.1,
    voteCount: 9200,
    poster: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    backdrop: 'https://image.tmdb.org/t/p/w780/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg',
    overview: "The story of J. Robert Oppenheimer's role in the development of the atomic bomb during World War II.",
    language: 'EN',
    genres: ['Drama', 'History'],
    type: 'movie',
  },
  {
    id: 157336,
    title: 'Interstellar',
    originalTitle: 'Interstellar',
    year: '2014',
    rating: 8.4,
    voteCount: 35000,
    poster: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    backdrop: 'https://image.tmdb.org/t/p/w780/xJHokMbljvjADYdit5fK5VQsXEG.jpg',
    overview: 'The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel.',
    language: 'EN',
    genres: ['Adventure', 'Drama', 'Sci-Fi'],
    type: 'movie',
  },
  {
    id: 27205,
    title: 'Inception',
    originalTitle: 'Inception',
    year: '2010',
    rating: 8.4,
    voteCount: 36000,
    poster: 'https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg',
    backdrop: 'https://image.tmdb.org/t/p/w780/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg',
    overview: 'Cobb, a skilled thief who commits corporate espionage by infiltrating the subconscious of his targets is offered a chance to regain his old life as payment for a task considered to be impossible: "inception".',
    language: 'EN',
    genres: ['Action', 'Sci-Fi', 'Adventure'],
    type: 'movie',
  },
  {
    id: 634649,
    title: 'Spider-Man: No Way Home',
    originalTitle: 'Spider-Man: No Way Home',
    year: '2021',
    rating: 8.0,
    voteCount: 19500,
    poster: 'https://image.tmdb.org/t/p/w500/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg',
    backdrop: 'https://image.tmdb.org/t/p/w780/14QbnygCuTO0vl7CAFmPf1fgZfV.jpg',
    overview: 'Peter Parker is unmasked and no longer able to separate his normal life from the high-stakes of being a super-hero.',
    language: 'EN',
    genres: ['Action', 'Adventure', 'Sci-Fi'],
    type: 'movie',
  },
  {
    id: 299534,
    title: 'Avengers: Endgame',
    originalTitle: 'Avengers: Endgame',
    year: '2019',
    rating: 8.3,
    voteCount: 25000,
    poster: 'https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg',
    backdrop: 'https://image.tmdb.org/t/p/w780/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg',
    overview: 'After the devastating events of Avengers: Infinity War, the universe is in ruins.',
    language: 'EN',
    genres: ['Adventure', 'Sci-Fi', 'Action'],
    type: 'movie',
  },
];

const FALLBACK_POPULAR_TV: MediaItem[] = [
  {
    id: 1399,
    title: 'Game of Thrones',
    originalTitle: 'Game of Thrones',
    year: '2011',
    rating: 8.4,
    voteCount: 23000,
    poster: 'https://image.tmdb.org/t/p/w500/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg',
    backdrop: 'https://image.tmdb.org/t/p/w780/2OMB0ynKlyIenMJWI2Dy9IWT4c.jpg',
    overview: 'Seven noble families fight for control of the mythical land of Westeros.',
    language: 'EN',
    genres: ['Sci-Fi & Fantasy', 'Drama', 'Action & Adv'],
    type: 'tv',
  },
  {
    id: 1396,
    title: 'Breaking Bad',
    originalTitle: 'Breaking Bad',
    year: '2008',
    rating: 8.9,
    voteCount: 14000,
    poster: 'https://image.tmdb.org/t/p/w500/ztkUQFLlC19CCMYHW9o1zWhJRNq.jpg',
    backdrop: 'https://image.tmdb.org/t/p/w780/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg',
    overview: 'A chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine.',
    language: 'EN',
    genres: ['Drama', 'Crime'],
    type: 'tv',
  },
  {
    id: 66732,
    title: 'Stranger Things',
    originalTitle: 'Stranger Things',
    year: '2016',
    rating: 8.6,
    voteCount: 17000,
    poster: 'https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg',
    backdrop: 'https://image.tmdb.org/t/p/w780/56v2KjBlU4XaOv9rVYEQypROD7P.jpg',
    overview: 'When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces and one strange little girl.',
    language: 'EN',
    genres: ['Sci-Fi & Fantasy', 'Drama', 'Mystery'],
    type: 'tv',
  },
  {
    id: 94605,
    title: 'Arcane',
    originalTitle: 'Arcane',
    year: '2021',
    rating: 8.7,
    voteCount: 4000,
    poster: 'https://image.tmdb.org/t/p/w500/fqldf2t8ztc9aiwn3k6mlX3tvRT.jpg',
    backdrop: 'https://image.tmdb.org/t/p/w780/vL5LR6WdxWPjCmvZ4wf6G449Z4D.jpg',
    overview: 'Amid the stark discord of twin cities Piltover and Zaun, two sisters fight on rival sides of a war between magic technologies and incompatible convictions.',
    language: 'EN',
    genres: ['Animation', 'Sci-Fi & Fantasy', 'Action & Adv'],
    type: 'tv',
  },
];

const FALLBACK_POPULAR_ANIME: MediaItem[] = [
  {
    id: 95479,
    title: 'Jujutsu Kaisen',
    originalTitle: '呪術廻戦',
    year: '2020',
    rating: 8.6,
    voteCount: 3500,
    poster: 'https://image.tmdb.org/t/p/w500/fHpKW59qJnR2cI4iL9r66q1xP1N.jpg',
    backdrop: 'https://image.tmdb.org/t/p/w780/3GQkM6e2z3pZ33hJdKj7s2pY2pB.jpg',
    overview: "Yuji Itadori, a kind-hearted teenager, joins his school's Occult Club for fun, but discovers that its members are actual sorcerers who can manipulate the energy between beings for their own use.",
    language: 'JA',
    genres: ['Animation', 'Action & Adv', 'Sci-Fi & Fantasy'],
    type: 'anime',
  },
  {
    id: 85937,
    title: 'Demon Slayer: Kimetsu no Yaiba',
    originalTitle: '鬼滅の刃',
    year: '2019',
    rating: 8.7,
    voteCount: 6100,
    poster: 'https://image.tmdb.org/t/p/w500/xUfRZu2mi8jH6SzQEJGP6tjBuYj.jpg',
    backdrop: 'https://image.tmdb.org/t/p/w780/nTvM4mhqZlHIvUkI1gVnWumrKil.jpg',
    overview: 'It is the Taisho Period in Japan. Tanjiro, a kindhearted boy who sells charcoal for a living, finds his family slaughtered by a demon.',
    language: 'JA',
    genres: ['Animation', 'Action & Adv', 'Sci-Fi & Fantasy'],
    type: 'anime',
  },
  {
    id: 30984,
    title: 'Bleach',
    originalTitle: 'BLEACH',
    year: '2004',
    rating: 8.4,
    voteCount: 1800,
    poster: 'https://image.tmdb.org/t/p/w500/2EewFaT95MuikxoxA7FmYim805b.jpg',
    backdrop: 'https://image.tmdb.org/t/p/w780/9Kx1418gPqfW9U8fL6R1fF9m5uR.jpg',
    overview: 'For as long as he can remember, Ichigo Kurosaki has been able to see ghosts.',
    language: 'JA',
    genres: ['Animation', 'Action & Adv', 'Sci-Fi & Fantasy'],
    type: 'anime',
  },
];

export interface HomeFeedData {
  heroBillboard: MediaItem[];
  top10: MediaItem[];
  top10Week: MediaItem[];
  top10TV: MediaItem[];
  top10Movies: MediaItem[];
  topRatedSeries: MediaItem[];
  trendingMovies: MediaItem[];
  popularSeries: MediaItem[];
  blockbusters: MediaItem[];
  topAnime: MediaItem[];
}

/**
 * Fetches official title logo image (transparent wordmark) for a movie or TV series
 */
export async function fetchMediaLogo(mediaId: number, type: 'movie' | 'tv' | 'anime'): Promise<string | null> {
  try {
    const tmdbType = type === 'tv' ? 'tv' : 'movie';
    const data = await tmdbFetch(`/${tmdbType}/${mediaId}/images?api_key=${ENV.TMDB_API_KEY}`);
    const logos = data.logos || [];
    const enLogo =
      logos.find((l: any) => l.iso_639_1 === 'en') ||
      logos.find((l: any) => !l.iso_639_1) ||
      logos[0];
    if (enLogo && enLogo.file_path) {
      return `${ENV.TMDB_IMAGE_BASE_URL}/w500${enLogo.file_path}`;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Fetches official trailer video for a movie, TV show, or anime.
 * Uses ENV.TRAILER_API_BASE_URL (IMDb 1080p MP4) as primary source,
 * falling back to TMDB YouTube trailer key.
 */
export async function fetchMediaTrailer(
  mediaId: number,
  type: 'movie' | 'tv' | 'anime'
): Promise<{ url?: string | null; key?: string | null } | null> {
  const tmdbType = type === 'tv' ? 'tv' : 'movie';

  // 1. Direct 1080p stream API (loaded from .env)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);
    const res = await fetch(`${ENV.TRAILER_API_BASE_URL}/${tmdbType}/${mediaId}`, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.url === 'string' && data.url.startsWith('http')) {
        return { url: data.url };
      }
    }
  } catch {
    // Proceed to fallback
  }

  // 2. TMDB YouTube trailer fallback
  try {
    const data = await tmdbFetch(`/${tmdbType}/${mediaId}/videos?api_key=${ENV.TMDB_API_KEY}&language=en-US`);
    let results: any[] = data.results || [];

    if (results.length === 0) {
      const allData = await tmdbFetch(`/${tmdbType}/${mediaId}/videos?api_key=${ENV.TMDB_API_KEY}`);
      results = allData.results || [];
    }

    if (results.length > 0) {
      const yt = results.filter((v: any) => v.site === 'YouTube' && v.key);
      if (yt.length > 0) {
        const officialTrailer = yt.find((v: any) => v.type === 'Trailer' && v.official);
        if (officialTrailer) return { key: officialTrailer.key };

        const anyTrailer = yt.find((v: any) => v.type === 'Trailer');
        if (anyTrailer) return { key: anyTrailer.key };

        const teaserOrClip = yt.find((v: any) => v.type === 'Teaser' || v.type === 'Clip');
        if (teaserOrClip) return { key: teaserOrClip.key };

        return { key: yt[0]?.key || null };
      }
    }
  } catch {
    // Ignore fallback errors
  }

  return null;
}

export async function fetchHomeFeed(): Promise<HomeFeedData> {
  const [
    trendingData,
    trendingWeekData,
    moviesData,
    tvData,
    animeData,
    topRatedData,
    topRatedTvData,
    tvTrendingWeekData,
    movieTrendingWeekData,
  ] = await Promise.all([
    tmdbFetch(`/trending/all/day?api_key=${ENV.TMDB_API_KEY}`).catch(() => ({ results: [] })),
    tmdbFetch(`/trending/all/week?api_key=${ENV.TMDB_API_KEY}`).catch(() => ({ results: [] })),
    tmdbFetch(`/movie/popular?api_key=${ENV.TMDB_API_KEY}&language=en-US`).catch(() => ({ results: [] })),
    tmdbFetch(`/tv/popular?api_key=${ENV.TMDB_API_KEY}&language=en-US`).catch(() => ({ results: [] })),
    tmdbFetch(`/discover/tv?api_key=${ENV.TMDB_API_KEY}&with_genres=16&with_original_language=ja&sort_by=popularity.desc`).catch(() => ({ results: [] })),
    tmdbFetch(`/movie/top_rated?api_key=${ENV.TMDB_API_KEY}&language=en-US`).catch(() => ({ results: [] })),
    tmdbFetch(`/tv/top_rated?api_key=${ENV.TMDB_API_KEY}&language=en-US`).catch(() => ({ results: [] })),
    tmdbFetch(`/trending/tv/week?api_key=${ENV.TMDB_API_KEY}`).catch(() => ({ results: [] })),
    tmdbFetch(`/trending/movie/week?api_key=${ENV.TMDB_API_KEY}`).catch(() => ({ results: [] })),
  ]);

  let allTrending: MediaItem[] = (trendingData.results || []).map((i: any) =>
    formatItem(i, i.media_type === 'tv' ? 'tv' : 'movie')
  );

  let top10Week: MediaItem[] = (trendingWeekData.results || []).map((i: any) =>
    formatItem(i, i.media_type === 'tv' ? 'tv' : 'movie')
  ).slice(0, 10);

  let top10TV: MediaItem[] = (tvTrendingWeekData.results || []).map((i: any) =>
    formatItem(i, 'tv')
  ).slice(0, 10);

  let top10Movies: MediaItem[] = (movieTrendingWeekData.results || []).map((i: any) =>
    formatItem(i, 'movie')
  ).slice(0, 10);

  let topRatedSeries: MediaItem[] = (topRatedTvData.results || []).map((i: any) =>
    formatItem(i, 'tv')
  ).slice(0, 15);

  let trendingMovies = (moviesData.results || []).map((i: any) => formatItem(i, 'movie')).slice(0, 15);
  let popularSeries = (tvData.results || []).map((i: any) => formatItem(i, 'tv')).slice(0, 15);
  let blockbusters = (topRatedData.results || []).map((i: any) => formatItem(i, 'movie')).slice(0, 12);
  let topAnime = (animeData.results || []).map((i: any) => formatItem(i, 'anime')).slice(0, 15);

  // Fallbacks if individual feeds return empty
  if (allTrending.length === 0) {
    allTrending = [...FALLBACK_POPULAR_MOVIES, ...FALLBACK_POPULAR_TV, ...FALLBACK_POPULAR_ANIME];
  }
  if (top10Week.length === 0) {
    top10Week = allTrending.slice(0, 10);
  }
  if (top10TV.length === 0) {
    top10TV = FALLBACK_POPULAR_TV;
  }
  if (top10Movies.length === 0) {
    top10Movies = FALLBACK_POPULAR_MOVIES;
  }
  if (topRatedSeries.length === 0) {
    topRatedSeries = FALLBACK_POPULAR_TV;
  }
  if (trendingMovies.length === 0) {
    trendingMovies = FALLBACK_POPULAR_MOVIES;
  }
  if (popularSeries.length === 0) {
    popularSeries = FALLBACK_POPULAR_TV;
  }
  if (blockbusters.length === 0) {
    blockbusters = FALLBACK_POPULAR_MOVIES.slice(1);
  }
  if (topAnime.length === 0) {
    topAnime = FALLBACK_POPULAR_ANIME;
  }

  // Fetch title logos & trailer video streams for top hero billboard candidates
  const horizontalCandidates = allTrending.filter(item => Boolean(item.backdrop));
  const heroCandidates = (horizontalCandidates.length >= 3 ? horizontalCandidates : allTrending).slice(0, 7);
  const heroBillboard = await Promise.all(
    heroCandidates.map(async item => {
      try {
        const [titleLogo, trailerData] = await Promise.all([
          fetchMediaLogo(item.id, item.type).catch(() => null),
          fetchMediaTrailer(item.id, item.type).catch(() => null),
        ]);
        return {
          ...item,
          titleLogo,
          trailerUrl: trailerData?.url || null,
          trailerKey: trailerData?.key || null,
        };
      } catch {
        return item;
      }
    })
  );

  return {
    heroBillboard,
    top10: allTrending.slice(0, 10),
    top10Week,
    top10TV,
    top10Movies,
    topRatedSeries,
    trendingMovies,
    popularSeries,
    blockbusters,
    topAnime,
  };
}

/**
 * Fetches items for a specific genre ID
 */
export async function fetchGenreContent(genreIdOrItem: number | { id: number; name?: string }, page = 1): Promise<MediaItem[]> {
  try {
    const genreId = typeof genreIdOrItem === 'number' ? genreIdOrItem : genreIdOrItem.id;
    const name = typeof genreIdOrItem === 'object' ? (genreIdOrItem.name || '').toLowerCase() : '';

    if (name === 'anime') {
      const data = await tmdbFetch(`/discover/tv?api_key=${ENV.TMDB_API_KEY}&with_genres=16&with_original_language=ja&sort_by=popularity.desc&page=${page}`);
      return (data.results || []).map((i: any) => formatItem(i, 'anime'));
    }

    const [movieData, tvData] = await Promise.all([
      tmdbFetch(`/discover/movie?api_key=${ENV.TMDB_API_KEY}&with_genres=${genreId}&sort_by=popularity.desc&page=${page}`).catch(() => ({ results: [] })),
      tmdbFetch(`/discover/tv?api_key=${ENV.TMDB_API_KEY}&with_genres=${genreId}&sort_by=popularity.desc&page=${page}`).catch(() => ({ results: [] })),
    ]);
    const movies = (movieData.results || []).map((i: any) => formatItem(i, 'movie'));
    const tvs = (tvData.results || []).map((i: any) => formatItem(i, 'tv'));
    const combined = [...movies, ...tvs].sort((a, b) => b.voteCount - a.voteCount);
    return combined;
  } catch (err) {
    console.warn(`Failed to fetch genre:`, err);
    return [];
  }
}

/**
 * Fetches items for a specific original language code (e.g. 'en', 'ja', 'ko', 'hi', 'pt', 'es', 'ta', 'te', etc.)
 */
export async function fetchLanguageContent(languageCode: string, page = 1): Promise<MediaItem[]> {
  try {
    const [movieData, tvData] = await Promise.all([
      tmdbFetch(`/discover/movie?api_key=${ENV.TMDB_API_KEY}&with_original_language=${languageCode}&sort_by=popularity.desc&page=${page}`).catch(() => ({ results: [] })),
      tmdbFetch(`/discover/tv?api_key=${ENV.TMDB_API_KEY}&with_original_language=${languageCode}&sort_by=popularity.desc&page=${page}`).catch(() => ({ results: [] })),
    ]);
    const movies = (movieData.results || []).map((i: any) => formatItem(i, 'movie'));
    const tvs = (tvData.results || []).map((i: any) => formatItem(i, 'tv'));
    const combined = [...movies, ...tvs].sort((a, b) => b.voteCount - a.voteCount);
    return combined;
  } catch (err) {
    console.warn(`Failed to fetch language ${languageCode}:`, err);
    return [];
  }
}

export async function searchContent(query: string, type: 'all' | 'movie' | 'tv' | 'anime' = 'all'): Promise<MediaItem[]> {
  if (!query.trim()) return [];
  const encoded = encodeURIComponent(query.trim());

  try {
    if (type === 'movie') {
      const data = await tmdbFetch(`/search/movie?api_key=${ENV.TMDB_API_KEY}&query=${encoded}&language=en-US`);
      return (data.results || []).map((item: any) => formatItem(item, 'movie'));
    } else if (type === 'tv') {
      const data = await tmdbFetch(`/search/tv?api_key=${ENV.TMDB_API_KEY}&query=${encoded}&language=en-US`);
      return (data.results || []).map((item: any) => formatItem(item, 'tv'));
    } else if (type === 'anime') {
      const data = await tmdbFetch(`/search/tv?api_key=${ENV.TMDB_API_KEY}&query=${encoded}&language=en-US`);
      return (data.results || [])
        .filter((i: any) => (i.genre_ids && i.genre_ids.includes(16)) || i.original_language === 'ja')
        .map((item: any) => formatItem(item, 'anime'));
    } else {
      // Multi search
      const data = await tmdbFetch(`/search/multi?api_key=${ENV.TMDB_API_KEY}&query=${encoded}&language=en-US`);
      return (data.results || [])
        .filter((i: any) => i.media_type === 'movie' || i.media_type === 'tv')
        .map((item: any) => formatItem(item, item.media_type === 'tv' ? 'tv' : 'movie'));
    }
  } catch (err) {
    console.warn('Search query failed:', err);
    return [];
  }
}

export async function fetchSimilarMedia(
  id: number,
  type: 'movie' | 'tv' | 'anime' = 'movie'
): Promise<MediaItem[]> {
  try {
    const mediaType = type === 'tv' ? 'tv' : 'movie';
    const data = await tmdbFetch(`/${mediaType}/${id}/recommendations?api_key=${ENV.TMDB_API_KEY}&language=en-US&page=1`);
    const results = (data.results || []).map((item: any) => formatItem(item, type));
    if (results.length > 0) return results.slice(0, 15);

    const simData = await tmdbFetch(`/${mediaType}/${id}/similar?api_key=${ENV.TMDB_API_KEY}&language=en-US&page=1`);
    return (simData.results || []).map((item: any) => formatItem(item, type)).slice(0, 15);
  } catch (err) {
    console.warn('Failed to fetch similar media:', err);
    return [];
  }
}

export interface TVSeason {
  id: number;
  name: string;
  seasonNumber: number;
  episodeCount: number;
  poster: string | null;
  overview: string;
  airDate?: string;
}

export interface TVEpisode {
  id: number;
  name: string;
  episodeNumber: number;
  seasonNumber: number;
  overview: string;
  still: string | null;
  rating: number;
  runtime: number;
  airDate?: string;
}

/**
 * Fetches all seasons for a given TV series or Anime
 */
export async function fetchTVSeasons(seriesId: number): Promise<TVSeason[]> {
  try {
    const data = await tmdbFetch(`/tv/${seriesId}?api_key=${ENV.TMDB_API_KEY}&language=en-US`);
    const rawSeasons: any[] = data.seasons || [];

    return rawSeasons
      .filter((s: any) => s.season_number > 0 && s.episode_count > 0)
      .map((s: any) => ({
        id: s.id,
        name: s.name || `Season ${s.season_number}`,
        seasonNumber: s.season_number,
        episodeCount: s.episode_count || 0,
        poster: s.poster_path ? `${ENV.TMDB_IMAGE_BASE_URL}/w342${s.poster_path}` : null,
        overview: s.overview || '',
        airDate: s.air_date || '',
      }));
  } catch (err) {
    console.warn('Failed to fetch TV seasons:', err);
    return [];
  }
}

/**
 * Fetches all episodes for a specific TV Season
 */
export async function fetchTVEpisodes(seriesId: number, seasonNumber: number): Promise<TVEpisode[]> {
  try {
    const data = await tmdbFetch(`/tv/${seriesId}/season/${seasonNumber}?api_key=${ENV.TMDB_API_KEY}&language=en-US`);
    const rawEpisodes: any[] = data.episodes || [];

    return rawEpisodes.map((ep: any) => ({
      id: ep.id,
      name: ep.name || `Episode ${ep.episode_number}`,
      episodeNumber: ep.episode_number,
      seasonNumber: ep.season_number || seasonNumber,
      overview: ep.overview || 'No description available for this episode.',
      still: ep.still_path ? `${ENV.TMDB_IMAGE_BASE_URL}/w300${ep.still_path}` : null,
      rating: typeof ep.vote_average === 'number' ? Number(ep.vote_average.toFixed(1)) : 0,
      runtime: ep.runtime || 0,
      airDate: ep.air_date || '',
    }));
  } catch (err) {
    console.warn(`Failed to fetch episodes for season ${seasonNumber}:`, err);
    return [];
  }
}

export interface NetworkOrProvider {
  id: number;
  name: string;
  logo: string | null;
}

const KNOWN_STUDIO_DOMAINS: Record<string, string> = {
  netflix: 'netflix.com',
  prime: 'primevideo.com',
  amazon: 'primevideo.com',
  disney: 'disneyplus.com',
  'disney+': 'disneyplus.com',
  apple: 'apple.com',
  'apple tv': 'tv.apple.com',
  'apple tv+': 'tv.apple.com',
  hbo: 'max.com',
  'hbo max': 'max.com',
  max: 'max.com',
  crunchyroll: 'crunchyroll.com',
  paramount: 'paramountplus.com',
  'paramount+': 'paramountplus.com',
  hulu: 'hulu.com',
  'warner bros': 'warnerbros.com',
  'warner bros. pictures': 'warnerbros.com',
  'warner bros. entertainment': 'warnerbros.com',
  marvel: 'marvel.com',
  'marvel studios': 'marvel.com',
  universal: 'universalpictures.com',
  'universal pictures': 'universalpictures.com',
  columbia: 'sonypictures.com',
  'columbia pictures': 'sonypictures.com',
  sony: 'sonypictures.com',
  'sony pictures': 'sonypictures.com',
  bbc: 'bbc.com',
  amc: 'amc.com',
  fx: 'fxnetworks.com',
  showtime: 'sho.com',
  starz: 'starz.com',
  thecw: 'cwtv.com',
  'the cw': 'cwtv.com',
  peacock: 'peacocktv.com',
  mgm: 'mgm.com',
  lionsgate: 'lionsgate.com',
  a24: 'a24films.com',
  lucasfilm: 'lucasfilm.com',
  '20th century': '20thcenturystudios.com',
  '20th century studios': '20thcenturystudios.com',
  toei: 'toei-anim.co.jp',
  'toei animation': 'toei-anim.co.jp',
  mappa: 'mappa.co.jp',
  ufotable: 'ufotable.com',
  wit: 'witstudio.co.jp',
  'wit studio': 'witstudio.co.jp',
  bones: 'bones.co.jp',
  madhouse: 'madhouse.co.jp',
  ghibli: 'ghibli.jp',
  'studio ghibli': 'ghibli.jp',
};

/**
 * Resolves a logo using web search / high-res favicon scraping fallback
 */
export function resolveWebLogo(name: string, tmdbLogoPath?: string | null): string {
  if (tmdbLogoPath) {
    if (tmdbLogoPath.startsWith('http')) return tmdbLogoPath;
    return `${ENV.TMDB_IMAGE_BASE_URL}/w300${tmdbLogoPath}`;
  }
  const clean = name.toLowerCase().trim();
  const matchedKey = Object.keys(KNOWN_STUDIO_DOMAINS).find(k => clean.includes(k) || k.includes(clean));
  const domain = matchedKey ? KNOWN_STUDIO_DOMAINS[matchedKey] : `${clean.replace(/[^a-z0-9]/g, '')}.com`;

  // High-res web brand logo scraping via Google Favicon V2 HD
  return `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=128`;
}

/**
 * Fetches broadcast networks, studios, and production company logos for a media item
 */
export async function fetchMediaNetworks(mediaId: number, type: 'movie' | 'tv' | 'anime'): Promise<NetworkOrProvider[]> {
  try {
    const tmdbType = type === 'movie' ? 'movie' : 'tv';
    const data = await tmdbFetch(`/${tmdbType}/${mediaId}?api_key=${ENV.TMDB_API_KEY}`);
    const results: NetworkOrProvider[] = [];
    if (data.networks && Array.isArray(data.networks)) {
      data.networks.forEach((n: any) => {
        if (n.name) {
          results.push({
            id: n.id,
            name: n.name,
            logo: resolveWebLogo(n.name, n.logo_path),
          });
        }
      });
    }
    if (data.production_companies && Array.isArray(data.production_companies)) {
      data.production_companies.forEach((c: any) => {
        if (c.name && !results.some(r => r.id === c.id)) {
          results.push({
            id: c.id,
            name: c.name,
            logo: resolveWebLogo(c.name, c.logo_path),
          });
        }
      });
    }
    return results.slice(0, 5);
  } catch {
    return [];
  }
}

export interface StudioInfo {
  id: string;
  name: string;
  networkId?: number;
  companyId?: number;
  providerId: number;
  color: string;
  bgColor: string;
  logoText: string;
  logoUrl: string;
  webFallbackUrl: string;
  tagline: string;
  categoryType?: 'movie' | 'tv' | 'both';
}

export const POPULAR_STUDIOS: StudioInfo[] = [
  {
    id: 'ghibli',
    name: 'Studio Ghibli',
    companyId: 10342,
    providerId: 10342,
    categoryType: 'movie',
    color: '#38BDF8',
    bgColor: '#161922',
    logoText: 'STUDIO GHIBLI',
    logoUrl: 'https://image.tmdb.org/t/p/w500/uFuxPEZRUcBTEiYIxjHJq62Vr77.png',
    webFallbackUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Studio_Ghibli.png/500px-Studio_Ghibli.png',
    tagline: 'Spirited Away, Princess Mononoke, Howl & Totoro',
  },
  {
    id: 'mappa',
    name: 'MAPPA',
    companyId: 21444,
    providerId: 21444,
    categoryType: 'both',
    color: '#EF4444',
    bgColor: '#161922',
    logoText: 'MAPPA',
    logoUrl: 'https://image.tmdb.org/t/p/w500/wSejGn3lAZdQ5muByxvzigwyDY6.png',
    webFallbackUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/MAPPA_Logo.svg/500px-MAPPA_Logo.svg.png',
    tagline: 'Jujutsu Kaisen, Attack on Titan, Chainsaw Man & Hell\'s Paradise',
  },
  {
    id: 'ufotable',
    name: 'Ufotable',
    companyId: 5887,
    providerId: 5887,
    categoryType: 'both',
    color: '#A855F7',
    bgColor: '#161922',
    logoText: 'ufotable',
    logoUrl: 'https://image.tmdb.org/t/p/w500/m6FEqz8rQECnmfjEwjNhNAlmhCJ.png',
    webFallbackUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Ufotable_logo.svg/500px-Ufotable_logo.svg.png',
    tagline: 'Demon Slayer, Fate/Zero & Fate/stay night Heaven\'s Feel',
  },
  {
    id: 'crunchyroll',
    name: 'Crunchyroll',
    networkId: 1112,
    providerId: 283,
    color: '#F97316',
    bgColor: '#161922',
    logoText: 'crunchyroll',
    logoUrl: 'https://lunoflix.fun/providers/crunchyroll.webp',
    webFallbackUrl: 'https://image.tmdb.org/t/p/w500/81cjvd924Uymkh4Elk5iWmsO4iq.png',
    tagline: "World's largest anime library",
  },
  {
    id: 'netflix',
    name: 'Netflix',
    networkId: 213,
    providerId: 8,
    color: '#E50914',
    bgColor: '#161922',
    logoText: 'NETFLIX',
    logoUrl: 'https://lunoflix.fun/providers/netflix.webp',
    webFallbackUrl: 'https://image.tmdb.org/t/p/w500/wwemzKWzjKYJFfCeiB57q3r4Bcm.png',
    tagline: 'Netflix Originals & Series',
  },
  {
    id: 'hbo',
    name: 'HBO Max',
    networkId: 3186,
    providerId: 384,
    color: '#A855F7',
    bgColor: '#161922',
    logoText: 'HBO MAX',
    logoUrl: 'https://lunoflix.fun/providers/hbomax.webp',
    webFallbackUrl: 'https://image.tmdb.org/t/p/w500/aS2zvJWn9Aq1NgQAA8F4Uhu07IO.png',
    tagline: 'Iconic series and blockbusters',
  },
  {
    id: 'prime',
    name: 'Prime Video',
    networkId: 1024,
    providerId: 119,
    color: '#00A8E1',
    bgColor: '#161922',
    logoText: 'prime video',
    logoUrl: 'https://lunoflix.fun/providers/primevideo.webp',
    webFallbackUrl: 'https://image.tmdb.org/t/p/w500/ifhbNuuqnlwYqXZWWnvxcvF50Ry.png',
    tagline: 'Amazon Originals & Exclusives',
  },
  {
    id: 'disney',
    name: 'Disney+',
    networkId: 2739,
    providerId: 337,
    color: '#3B82F6',
    bgColor: '#161922',
    logoText: 'DISNEY+',
    logoUrl: 'https://lunoflix.fun/providers/disney.webp',
    webFallbackUrl: 'https://image.tmdb.org/t/p/w500/dgPueyEdOwpQ10jruhL9vUQ4wMT.png',
    tagline: 'Disney, Pixar, Marvel, Star Wars',
  },
  {
    id: 'appletv',
    name: 'Apple TV+',
    networkId: 2552,
    providerId: 350,
    color: '#F8FAFC',
    bgColor: '#161922',
    logoText: ' tv+',
    logoUrl: 'https://lunoflix.fun/providers/appletv.webp',
    webFallbackUrl: 'https://image.tmdb.org/t/p/w500/4KAy34EHv8G2RODIvlKmND4202q.png',
    tagline: 'Original stories & prestige TV',
  },
  {
    id: 'paramount',
    name: 'Paramount+',
    networkId: 4330,
    providerId: 531,
    color: '#38BDF8',
    bgColor: '#161922',
    logoText: 'PARAMOUNT+',
    logoUrl: 'https://lunoflix.fun/providers/paramount.webp',
    webFallbackUrl: 'https://image.tmdb.org/t/p/w500/fi83B1oztoS47xxcemFdPMhIzK.png',
    tagline: 'Mountain of Entertainment',
  },
  {
    id: 'peacock',
    name: 'Peacock',
    networkId: 3353,
    providerId: 386,
    color: '#FACC15',
    bgColor: '#161922',
    logoText: 'peacock',
    logoUrl: 'https://lunoflix.fun/providers/peacock.webp',
    webFallbackUrl: 'https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://peacocktv.com&size=128',
    tagline: 'NBCUniversal shows, live sports & originals',
  },
  {
    id: 'amc',
    name: 'AMC+',
    networkId: 174,
    providerId: 528,
    color: '#E2E8F0',
    bgColor: '#161922',
    logoText: 'amc',
    logoUrl: 'https://lunoflix.fun/providers/amc.webp',
    webFallbackUrl: 'https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://amcplus.com&size=128',
    tagline: 'The Walking Dead, Breaking Bad & originals',
  },
  {
    id: 'hulu',
    name: 'Hulu',
    networkId: 453,
    providerId: 15,
    color: '#22C55E',
    bgColor: '#161922',
    logoText: 'hulu',
    logoUrl: 'https://lunoflix.fun/providers/hulu.webp',
    webFallbackUrl: 'https://image.tmdb.org/t/p/w500/pqUTCleNUiTLAVlezOmYJWwwb3j.png',
    tagline: 'Originals, FX shows, and TV hits',
  },
  {
    id: 'showtime',
    name: 'Showtime',
    networkId: 67,
    providerId: 37,
    color: '#DC2626',
    bgColor: '#161922',
    logoText: 'SHOWTIME',
    logoUrl: 'https://image.tmdb.org/t/p/w500/Allse9kbjiP6ExaQrnSpIhkurEi.png',
    webFallbackUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Showtime.svg/500px-Showtime.svg.png',
    tagline: 'Yellowjackets, Dexter, Homeland & Billions',
  },
  {
    id: 'starz',
    name: 'Starz',
    networkId: 318,
    providerId: 43,
    color: '#008489',
    bgColor: '#161922',
    logoText: 'STARZ',
    logoUrl: 'https://image.tmdb.org/t/p/w500/qx3Y9LCaK4mq1ykFuDIfjshlo3U.png',
    webFallbackUrl: 'https://image.tmdb.org/t/p/w500/8GJjw3HHsAJYwIWKIPBPfqMxlEa.png',
    tagline: 'Outlander, Power, Black Sails & Spartacus',
  },
  {
    id: 'fx',
    name: 'FX',
    networkId: 88,
    providerId: 237,
    color: '#FACC15',
    bgColor: '#161922',
    logoText: 'FX',
    logoUrl: 'https://image.tmdb.org/t/p/w500/aexGjtcs42DgRtZh7zOxayiry4J.png',
    webFallbackUrl: 'https://image.tmdb.org/t/p/w500/bPrSGSrI7w36yBFVBSNDCKo5TkY.png',
    tagline: 'Shōgun, The Bear, Fargo & American Horror Story',
  },
  {
    id: 'thecw',
    name: 'The CW',
    networkId: 71,
    providerId: 83,
    color: '#16A34A',
    bgColor: '#161922',
    logoText: 'CW',
    logoUrl: 'https://image.tmdb.org/t/p/w500/hEpcdJ4O6eitG9ADSnDXNUrlovS.png',
    webFallbackUrl: 'https://image.tmdb.org/t/p/w500/ge9hzeaU7nMtQ4PjkFlc68dGAJ9.png',
    tagline: 'Supernatural, Arrowverse, Flash & Vampire Diaries',
  },
  {
    id: 'cartoonnetwork',
    name: 'Cartoon Network',
    networkId: 56,
    providerId: 56,
    color: '#FFFFFF',
    bgColor: '#161922',
    logoText: 'CN',
    logoUrl: 'https://image.tmdb.org/t/p/w500/c5OC6oVCg6QP4eqzW6XIq17CQjI.png',
    webFallbackUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Cartoon_Network_2010_logo.svg/500px-Cartoon_Network_2010_logo.svg.png',
    tagline: 'Ben 10, Adventure Time, Regular Show & Teen Titans',
  },
  {
    id: 'adultswim',
    name: '[adult swim]',
    networkId: 80,
    providerId: 80,
    color: '#38BDF8',
    bgColor: '#161922',
    logoText: '[adult swim]',
    logoUrl: 'https://image.tmdb.org/t/p/w500/tHZPHOLc6iF27G34cAZGPsMtMSy.png',
    webFallbackUrl: 'https://image.tmdb.org/t/p/w500/kQeyUlXpgm6gHEnSObbfXS9sJ3m.png',
    tagline: 'Rick and Morty, Primal, FLCL & Robot Chicken',
  },
  {
    id: 'bbc',
    name: 'BBC iPlayer',
    networkId: 4,
    providerId: 332,
    color: '#DC2626',
    bgColor: '#161922',
    logoText: 'BBC',
    logoUrl: 'https://image.tmdb.org/t/p/w500/uJjcCg3O4DMEjM0xtno9OWFciRP.png',
    webFallbackUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/BBC_Logo_2021.svg/500px-BBC_Logo_2021.svg.png',
    tagline: 'Doctor Who, Sherlock, Peaky Blinders & Planet Earth',
  },
  {
    id: 'discovery',
    name: 'Discovery+',
    networkId: 4353,
    providerId: 582,
    color: '#0284C7',
    bgColor: '#161922',
    logoText: 'discovery+',
    logoUrl: 'https://image.tmdb.org/t/p/w500/1D1bS3Dyw4ScYnFWTlBOvJXC3nb.png',
    webFallbackUrl: 'https://image.tmdb.org/t/p/w500/bFC5XsARrCaYV9gNPwpqMEydBJ5.png',
    tagline: 'MythBusters, Deadliest Catch & Documentaries',
  },
  {
    id: 'mgm',
    name: 'MGM+',
    networkId: 466,
    providerId: 34,
    color: '#EAB308',
    bgColor: '#161922',
    logoText: 'MGM+',
    logoUrl: 'https://image.tmdb.org/t/p/w500/6SnRcF523HHQ2b0396M6aBMvZ26.png',
    webFallbackUrl: 'https://image.tmdb.org/t/p/w500/ke3GCMWqnxUBS3TBWOZOfmoH1uq.png',
    tagline: 'From, Godfather of Harlem & MGM Blockbusters',
  },
];

export async function fetchStudioContent(studioOrNetworkId: number | StudioInfo, page = 1): Promise<MediaItem[]> {
  try {
    if (typeof studioOrNetworkId === 'object') {
      const studio = studioOrNetworkId;
      if (studio.companyId) {
        if (studio.categoryType === 'movie') {
          const data = await tmdbFetch(`/discover/movie?api_key=${ENV.TMDB_API_KEY}&with_companies=${studio.companyId}&sort_by=popularity.desc&page=${page}`);
          return (data.results || []).map((item: any) => formatItem(item, 'movie'));
        }
        if (studio.categoryType === 'tv') {
          const data = await tmdbFetch(`/discover/tv?api_key=${ENV.TMDB_API_KEY}&with_companies=${studio.companyId}&sort_by=popularity.desc&page=${page}`);
          return (data.results || []).map((item: any) => formatItem(item, 'tv'));
        }
        // Both Movies & TV (e.g. MAPPA, Ufotable)
        const [tvData, movieData] = await Promise.all([
          tmdbFetch(`/discover/tv?api_key=${ENV.TMDB_API_KEY}&with_companies=${studio.companyId}&sort_by=popularity.desc&page=${page}`).catch(() => ({ results: [] })),
          tmdbFetch(`/discover/movie?api_key=${ENV.TMDB_API_KEY}&with_companies=${studio.companyId}&sort_by=popularity.desc&page=${page}`).catch(() => ({ results: [] })),
        ]);
        const tvItems = (tvData.results || []).map((i: any) => formatItem(i, 'tv'));
        const movieItems = (movieData.results || []).map((i: any) => formatItem(i, 'movie'));
        const combined = [...tvItems, ...movieItems].sort((a, b) => b.voteCount - a.voteCount);
        return combined;
      }
      if (studio.networkId) {
        const data = await tmdbFetch(`/discover/tv?api_key=${ENV.TMDB_API_KEY}&with_networks=${studio.networkId}&sort_by=popularity.desc&page=${page}`);
        return (data.results || []).map((item: any) => formatItem(item, 'tv'));
      }
    }
    const networkId = typeof studioOrNetworkId === 'number' ? studioOrNetworkId : studioOrNetworkId.networkId || 213;
    const data = await tmdbFetch(`/discover/tv?api_key=${ENV.TMDB_API_KEY}&with_networks=${networkId}&sort_by=popularity.desc&page=${page}`);
    return (data.results || []).map((item: any) => formatItem(item, 'tv'));
  } catch (err) {
    console.warn(`Failed to fetch studio content:`, err);
    return [];
  }
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile: string | null;
  order: number;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile: string | null;
}

export interface MediaCredits {
  cast: CastMember[];
  directors: CrewMember[];
  creators: CrewMember[];
  writers: CrewMember[];
  producers: CrewMember[];
}

export interface MediaExtendedDetails {
  runtime?: number;
  runtimeFormatted?: string;
  releaseDateFormatted?: string;
  status?: string;
  certification?: string;
  contentAdvisories: string[];
  tagline?: string;
  budgetFormatted?: string;
  revenueFormatted?: string;
  originalLanguageFormatted?: string;
  spokenLanguages: string[];
  productionCountries: string[];
  productionCompanies: string[];
  totalSeasons?: number;
  totalEpisodes?: number;
}

/**
 * Fetches star cast, director, creators, writers, and key crew members
 */
export async function fetchMediaCredits(
  mediaId: number,
  type: 'movie' | 'tv' | 'anime'
): Promise<MediaCredits> {
  try {
    const tmdbType = type === 'tv' ? 'tv' : 'movie';
    const data = await tmdbFetch(`/${tmdbType}/${mediaId}/credits?api_key=${ENV.TMDB_API_KEY}&language=en-US`);

    const rawCast: any[] = data.cast || [];
    const rawCrew: any[] = data.crew || [];

    const cast: CastMember[] = rawCast.slice(0, 20).map((c: any) => ({
      id: c.id,
      name: c.name || c.original_name || 'Unknown',
      character: c.character || 'Role',
      profile: c.profile_path ? `${ENV.TMDB_IMAGE_BASE_URL}/w185${c.profile_path}` : null,
      order: c.order || 0,
    }));

    const directors = rawCrew
      .filter((cr: any) => cr.job === 'Director' || cr.department === 'Directing')
      .map((cr: any) => ({
        id: cr.id,
        name: cr.name || cr.original_name,
        job: cr.job || 'Director',
        department: cr.department || 'Directing',
        profile: cr.profile_path ? `${ENV.TMDB_IMAGE_BASE_URL}/w185${cr.profile_path}` : null,
      }))
      .slice(0, 4);

    const creators = rawCrew
      .filter((cr: any) => cr.job === 'Creator' || cr.job === 'Executive Producer' || cr.job === 'Showrunner')
      .map((cr: any) => ({
        id: cr.id,
        name: cr.name || cr.original_name,
        job: cr.job,
        department: cr.department,
        profile: cr.profile_path ? `${ENV.TMDB_IMAGE_BASE_URL}/w185${cr.profile_path}` : null,
      }))
      .slice(0, 4);

    const writers = rawCrew
      .filter((cr: any) => cr.job === 'Writer' || cr.job === 'Screenplay' || cr.job === 'Author' || cr.job === 'Story')
      .map((cr: any) => ({
        id: cr.id,
        name: cr.name || cr.original_name,
        job: cr.job,
        department: cr.department,
        profile: cr.profile_path ? `${ENV.TMDB_IMAGE_BASE_URL}/w185${cr.profile_path}` : null,
      }))
      .slice(0, 4);

    const producers = rawCrew
      .filter((cr: any) => cr.job === 'Producer' || cr.job === 'Co-Producer')
      .map((cr: any) => ({
        id: cr.id,
        name: cr.name || cr.original_name,
        job: cr.job,
        department: cr.department,
        profile: cr.profile_path ? `${ENV.TMDB_IMAGE_BASE_URL}/w185${cr.profile_path}` : null,
      }))
      .slice(0, 4);

    return {
      cast,
      directors,
      creators,
      writers,
      producers,
    };
  } catch (err) {
    console.warn('Failed to fetch media credits:', err);
    return {
      cast: [],
      directors: [],
      creators: [],
      writers: [],
      producers: [],
    };
  }
}

/**
 * Fetches full extended details including certification, advisory ratings, runtime, budget, languages
 */
export async function fetchMediaExtendedDetails(
  mediaId: number,
  type: 'movie' | 'tv' | 'anime'
): Promise<MediaExtendedDetails> {
  try {
    const tmdbType = type === 'tv' ? 'tv' : 'movie';
    const data = await tmdbFetch(
      `/${tmdbType}/${mediaId}?api_key=${ENV.TMDB_API_KEY}&language=en-US&append_to_response=release_dates,content_ratings`
    );

    // 1. Runtime Formatting
    let runtimeFormatted = '';
    const runtime = data.runtime || (data.episode_run_time && data.episode_run_time[0]) || 0;
    if (runtime > 0) {
      const hrs = Math.floor(runtime / 60);
      const mins = runtime % 60;
      runtimeFormatted = hrs > 0 ? `${hrs}h ${mins > 0 ? mins + 'm' : ''}` : `${mins}m`;
    } else if (data.number_of_episodes) {
      runtimeFormatted = `${data.number_of_episodes} Episodes`;
    }

    // 2. Release Date Formatting
    let releaseDateFormatted = '';
    const rawDate = data.release_date || data.first_air_date || '';
    if (rawDate) {
      try {
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) {
          releaseDateFormatted = d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
        } else {
          releaseDateFormatted = rawDate;
        }
      } catch {
        releaseDateFormatted = rawDate;
      }
    }

    // 3. Certification Extraction
    let certification = '';
    if (type === 'movie' && data.release_dates && data.release_dates.results) {
      const relResults: any[] = data.release_dates.results;
      const usRel = relResults.find((r: any) => r.iso_3166_1 === 'US') ||
                    relResults.find((r: any) => r.iso_3166_1 === 'GB') ||
                    relResults.find((r: any) => r.iso_3166_1 === 'IN') ||
                    relResults[0];
      if (usRel && usRel.release_dates && usRel.release_dates.length > 0) {
        const certified = usRel.release_dates.find((d: any) => d.certification);
        if (certified) certification = certified.certification;
      }
    } else if (data.content_ratings && data.content_ratings.results) {
      const crResults: any[] = data.content_ratings.results;
      const usCr = crResults.find((r: any) => r.iso_3166_1 === 'US') ||
                   crResults.find((r: any) => r.iso_3166_1 === 'GB') ||
                   crResults.find((r: any) => r.iso_3166_1 === 'IN') ||
                   crResults[0];
      if (usCr) certification = usCr.rating;
    }
    if (!certification) {
      certification = type === 'movie' ? 'PG-13' : 'TV-14';
    }

    // 4. Content Advisory Tags Synthesis
    const advisories: string[] = [];
    const certUpper = certification.toUpperCase();
    const genres = (data.genres || []).map((g: any) => g.name.toLowerCase());
    const overview = (data.overview || '').toLowerCase();

    if (certUpper.includes('R') || certUpper.includes('18') || certUpper.includes('MA') || certUpper.includes('A')) {
      advisories.push('Violence', 'Strong Language', 'Mature Themes');
    } else if (certUpper.includes('16') || certUpper.includes('14') || certUpper.includes('15')) {
      advisories.push('Intense Violence', 'Coarse Language');
    } else if (certUpper.includes('PG-13') || certUpper.includes('12')) {
      advisories.push('Action Violence', 'Brief Language');
    } else {
      advisories.push('General Audience', 'Mild Fantasy');
    }

    if (genres.some((g: string) => g.includes('horror') || g.includes('thriller'))) {
      advisories.push('Frightening Scenes', 'Gore & Blood');
    }
    if (genres.some((g: string) => g.includes('crime') || g.includes('mystery'))) {
      advisories.push('Substance Abuse', 'Criminal Depictions');
    }
    if (genres.some((g: string) => g.includes('sci-fi') || g.includes('action'))) {
      if (!advisories.includes('Action Violence')) advisories.push('Flashing Lights', 'Intense Sequences');
    }
    if (overview.includes('drug') || overview.includes('alcohol') || overview.includes('smoking')) {
      advisories.push('Smoking & Substance Use');
    }

    const uniqueAdvisories = Array.from(new Set(advisories)).slice(0, 5);

    // 5. Budget & Revenue Formatter
    const formatCurrency = (amount: number) => {
      if (!amount || amount <= 0) return null;
      if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(1)}B`;
      if (amount >= 1000000) return `$${(amount / 1000000).toFixed(0)}M`;
      return `$${amount.toLocaleString()}`;
    };

    const budgetFormatted = formatCurrency(data.budget) || undefined;
    const revenueFormatted = formatCurrency(data.revenue) || undefined;

    // 6. Spoken Languages & Countries
    const spokenLanguages = (data.spoken_languages || []).map((l: any) => l.english_name || l.name).filter(Boolean);
    const productionCountries = (data.production_countries || []).map((c: any) => c.name).filter(Boolean);
    const productionCompanies = (data.production_companies || []).map((c: any) => c.name).filter(Boolean).slice(0, 5);

    // 7. Original Language
    const origLangCode = (data.original_language || 'en').toUpperCase();
    const origLangName = data.spoken_languages?.find((l: any) => (l.iso_639_1 || '').toUpperCase() === origLangCode)?.english_name || origLangCode;
    const originalLanguageFormatted = `${origLangName} (${origLangCode})`;

    return {
      runtime,
      runtimeFormatted,
      releaseDateFormatted,
      status: data.status || 'Released',
      certification,
      contentAdvisories: uniqueAdvisories,
      tagline: data.tagline || undefined,
      budgetFormatted,
      revenueFormatted,
      originalLanguageFormatted,
      spokenLanguages,
      productionCountries,
      productionCompanies,
      totalSeasons: data.number_of_seasons || undefined,
      totalEpisodes: data.number_of_episodes || undefined,
    };
  } catch (err) {
    console.warn('Failed to fetch media extended details:', err);
    return {
      contentAdvisories: ['General Audience', 'Mild Violence'],
      spokenLanguages: ['English'],
      productionCountries: ['United States'],
      productionCompanies: [],
    };
  }
}

