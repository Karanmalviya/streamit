import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {
  MediaItem,
  StudioInfo,
  POPULAR_STUDIOS,
  fetchStudioContent,
  fetchGenreContent,
  fetchLanguageContent,
  fetchFeedSectionContent,
} from '../services/tmdb';
import { TVFocusable } from '../components/common/TVFocusable';
import { PosterGrid } from '../components/catalog/PosterGrid';
import { useDeviceMode } from '../hooks/useDeviceMode';
import { GenreItem, POPULAR_GENRES } from '../components/home/GenreRail';
import { LanguageItem, POPULAR_LANGUAGES } from '../components/home/LanguageRail';

export type ListingViewConfig =
  | { type: 'studio'; studio: StudioInfo }
  | { type: 'genre'; genre: GenreItem }
  | { type: 'language'; language: LanguageItem }
  | { type: 'feed'; title: string; feedKey?: string; items?: MediaItem[] }
  | { type: 'hub_studios'; title?: string }
  | { type: 'hub_genres'; title?: string }
  | { type: 'hub_languages'; title?: string };

interface ListingScreenProps {
  config: ListingViewConfig;
  topInset: number;
  onBack: () => void;
  onSelectMedia: (item: MediaItem) => void;
  onNavigateListing: (config: ListingViewConfig) => void;
}

function BackArrowIcon({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
  const headSize = size * 0.46;
  return (
    <View style={[styles.arrowContainer, { width: size, height: size }]}>
      <View
        style={[
          styles.arrowStem,
          {
            width: size * 0.78,
            backgroundColor: color,
          },
        ]}
      />
      <View
        style={[
          styles.arrowHead,
          {
            width: headSize,
            height: headSize,
            borderLeftColor: color,
            borderBottomColor: color,
          },
        ]}
      />
    </View>
  );
}

const HubGenreCard = React.forwardRef<any, {
  genre: GenreItem;
  index: number;
  isTV: boolean;
  onPress: () => void;
  onPressUp?: () => void;
}>(function RenderHubGenreCard({ genre, isTV, onPress, onPressUp }, ref) {
  const [imgError, setImgError] = useState(false);

  return (
    <TVFocusable
      ref={ref}
      style={[styles.genreCard, isTV && styles.genreCardTV]}
      focusedStyle={styles.cardFocused}
      onPressUp={onPressUp}
      onPress={onPress}>
      <View style={[styles.genreInner, { backgroundColor: genre.color }]}>
        {!imgError && genre.imageUrl ? (
          <Image
            source={{ uri: genre.imageUrl }}
            style={styles.cardImage}
            resizeMode="cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <Text style={styles.fallbackText}>{genre.name}</Text>
        )}
      </View>
    </TVFocusable>
  );
});

const HubLanguageCard = React.forwardRef<any, {
  lang: LanguageItem;
  index: number;
  isTV: boolean;
  onPress: () => void;
  onPressUp?: () => void;
}>(function RenderHubLanguageCard({ lang, isTV, onPress, onPressUp }, ref) {
  const [imgError, setImgError] = useState(false);

  return (
    <TVFocusable
      ref={ref}
      style={[styles.genreCard, isTV && styles.genreCardTV]}
      focusedStyle={styles.cardFocused}
      onPressUp={onPressUp}
      onPress={onPress}>
      <View style={[styles.genreInner, { backgroundColor: lang.color }]}>
        {!imgError && lang.imageUrl ? (
          <Image
            source={{ uri: lang.imageUrl }}
            style={styles.cardImage}
            resizeMode="cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <Text style={styles.fallbackText}>{lang.nativeName || lang.name}</Text>
        )}
      </View>
    </TVFocusable>
  );
});

const HubStudioCard = React.forwardRef<any, {
  studio: StudioInfo;
  index: number;
  isTV: boolean;
  onPress: () => void;
  onPressUp?: () => void;
}>(function RenderHubStudioCard({ studio, isTV, onPress, onPressUp }, ref) {
  const [errCount, setErrCount] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const currentUri = errCount === 0 ? studio.logoUrl : errCount === 1 ? studio.webFallbackUrl : null;

  const isAppIcon =
    studio.isAppIcon ??
    ['netflix', 'disney', 'jiohotstar', 'prime', 'appletv', 'hulu', 'paramount', 'peacock', 'crunchyroll', 'zee5', 'sonyliv', 'starz'].includes(
      studio.id
    );

  return (
    <View style={[styles.studioItemWrap, isTV && styles.studioItemWrapTV]}>
      <TVFocusable
        ref={ref}
        style={[
          styles.studioCard,
          isTV && styles.studioCardTV,
          { backgroundColor: studio.bgColor || '#000000' },
        ]}
        focusedStyle={styles.cardFocused}
        borderRadius={isTV ? 20 : 16}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onPressUp={onPressUp}
        onPress={onPress}>
        {currentUri ? (
          isAppIcon ? (
            <Image
              source={{ uri: currentUri }}
              style={styles.studioLogo}
              resizeMode="cover"
              onError={() => setErrCount(prev => prev + 1)}
            />
          ) : (
            <View style={[styles.logoPaddedWrap, isTV && styles.logoPaddedWrapTV]}>
              <Image
                source={{ uri: currentUri }}
                style={styles.studioLogoContain}
                resizeMode="contain"
                onError={() => setErrCount(prev => prev + 1)}
              />
            </View>
          )
        ) : (
          <View style={[styles.fallbackWrap, { backgroundColor: studio.bgColor || '#161922' }]}>
            <Text style={[styles.fallbackText, { color: studio.color || '#FFFFFF' }]}>
              {studio.logoText || studio.name}
            </Text>
          </View>
        )}
      </TVFocusable>
      <Text
        style={[styles.studioLabel, isTV && styles.studioLabelTV, isFocused && styles.studioLabelFocused]}
        numberOfLines={1}>
        {studio.name}
      </Text>
    </View>
  );
});

export function ListingScreen({
  config,
  topInset,
  onBack,
  onSelectMedia,
  onNavigateListing,
}: ListingScreenProps) {
  const { isTV, isLandscape } = useDeviceMode();
  const isWide = isTV || isLandscape;

  const backBtnRef = useRef<any>(null);
  const firstItemRef = useRef<any>(null);
  const allTabRef = useRef<any>(null);
  const movieTabRef = useRef<any>(null);
  const tvTabRef = useRef<any>(null);
  const isFetchingMoreRef = useRef(false);
  const pageRef = useRef(1);
  const hasMoreRef = useRef(true);

  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [_page, setPage] = useState(1);
  const [_hasMore, setHasMore] = useState(true);
  const [logoError, setLogoError] = useState(false);
  const [studioTab, setStudioTab] = useState<'all' | 'movie' | 'tv'>('all');

  const hasStudioTabs = config.type === 'studio';

  // Focus Back Button on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      backBtnRef.current?.focus?.();
    }, 80);
    return () => clearTimeout(timer);
  }, [config]);

  const loadData = useCallback(
    async (targetPage = 1, append = false, currentStudioTab?: 'all' | 'movie' | 'tv') => {
      if (config.type.startsWith('hub_')) return;
      if (config.type === 'feed' && !config.feedKey) return;
      if (append && (isFetchingMoreRef.current || !hasMoreRef.current)) return;
      if (append) isFetchingMoreRef.current = true;

      const activeTab = currentStudioTab !== undefined ? currentStudioTab : studioTab;

      try {
        if (!append) {
          setLoading(true);
          setHasMore(true);
          hasMoreRef.current = true;
          pageRef.current = 1;
        } else {
          setLoadingMore(true);
        }

        let res: MediaItem[] = [];
        if (config.type === 'studio') {
          if (!append) {
            // Load 2 pages in parallel upfront so the catalog is immediately deep (40-80 items)
            const [p1, p2] = await Promise.all([
              fetchStudioContent(config.studio, 1, activeTab),
              fetchStudioContent(config.studio, 2, activeTab),
            ]);
            const seen = new Set<number>();
            res = [...p1, ...p2].filter(item => {
              if (seen.has(item.id)) return false;
              seen.add(item.id);
              return true;
            });
            pageRef.current = p2.length > 0 ? 2 : 1;
            setPage(pageRef.current);
          } else {
            res = await fetchStudioContent(config.studio, targetPage, activeTab);
            pageRef.current = targetPage;
            setPage(targetPage);
          }
        } else if (config.type === 'genre') {
          if (!append) {
            const [p1, p2] = await Promise.all([
              fetchGenreContent(config.genre, 1),
              fetchGenreContent(config.genre, 2),
            ]);
            const seen = new Set<number>();
            res = [...p1, ...p2].filter(item => {
              if (seen.has(item.id)) return false;
              seen.add(item.id);
              return true;
            });
            pageRef.current = p2.length > 0 ? 2 : 1;
            setPage(pageRef.current);
          } else {
            res = await fetchGenreContent(config.genre, targetPage);
            pageRef.current = targetPage;
            setPage(targetPage);
          }
        } else if (config.type === 'language') {
          if (!append) {
            const [p1, p2] = await Promise.all([
              fetchLanguageContent(config.language.code, 1),
              fetchLanguageContent(config.language.code, 2),
            ]);
            const seen = new Set<number>();
            res = [...p1, ...p2].filter(item => {
              if (seen.has(item.id)) return false;
              seen.add(item.id);
              return true;
            });
            pageRef.current = p2.length > 0 ? 2 : 1;
            setPage(pageRef.current);
          } else {
            res = await fetchLanguageContent(config.language.code, targetPage);
            pageRef.current = targetPage;
            setPage(targetPage);
          }
        } else if (config.type === 'feed' && config.feedKey) {
          if (!append) {
            const [p1, p2] = await Promise.all([
              fetchFeedSectionContent(config.feedKey, 1),
              fetchFeedSectionContent(config.feedKey, 2),
            ]);
            const seen = new Set<number>();
            res = [...p1, ...p2].filter(item => {
              if (seen.has(item.id)) return false;
              seen.add(item.id);
              return true;
            });
            pageRef.current = p2.length > 0 ? 2 : 1;
            setPage(pageRef.current);
          } else {
            res = await fetchFeedSectionContent(config.feedKey, targetPage);
            pageRef.current = targetPage;
            setPage(targetPage);
          }
        }

        if (!res || res.length === 0) {
          setHasMore(false);
          hasMoreRef.current = false;
        }

        if (append) {
          setItems(prev => {
            const seen = new Set(prev.map(i => i.id));
            const fresh = res.filter(i => !seen.has(i.id));
            return [...prev, ...fresh];
          });
        } else {
          setItems(res);
        }
      } catch (err) {
        console.warn('Listing fetch error:', err);
      } finally {
        isFetchingMoreRef.current = false;
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [config, studioTab]
  );

  const handleSelectStudioTab = useCallback(
    (tab: 'all' | 'movie' | 'tv') => {
      if (tab === studioTab) return;
      setStudioTab(tab);
      pageRef.current = 1;
      setPage(1);
      hasMoreRef.current = true;
      setHasMore(true);
      setItems([]);
      loadData(1, false, tab);
    },
    [studioTab, loadData]
  );

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    setLogoError(false);
    setStudioTab('all');

    if (config.type === 'feed') {
      if (config.feedKey) {
        // If initial items are provided, show them immediately, then fetch fresh page
        if (config.items && config.items.length > 0) {
          setItems(config.items);
        }
        loadData(1, false, 'all');
      } else {
        setItems(config.items || []);
        setLoading(false);
        setHasMore(false);
      }
    } else if (!config.type.startsWith('hub_')) {
      setItems([]);
      loadData(1, false, 'all');
    }
  }, [config, loadData]);

  // Title calculation
  let title = '';
  let subtitle = '';
  if (config.type === 'studio') {
    title = config.studio.name;
    subtitle =
      studioTab === 'movie'
        ? `${config.studio.name} Movies`
        : studioTab === 'tv'
        ? `${config.studio.name} TV Shows & Series`
        : config.studio.tagline;
  } else if (config.type === 'genre') {
    title = config.genre.name;
  } else if (config.type === 'language') {
    title = config.language.name;
    subtitle = config.language.nativeName && config.language.nativeName !== config.language.name ? `(${config.language.nativeName})` : '';
  } else if (config.type === 'feed') {
    title = config.title;
    subtitle = config.feedKey ? 'All Trending & Popular' : `${(config.items || []).length} titles`;
  } else if (config.type === 'hub_studios') {
    title = 'All Channels & Studios';
    subtitle = `${POPULAR_STUDIOS.length} platforms available`;
  } else if (config.type === 'hub_genres') {
    title = 'All Genres';
    subtitle = `${POPULAR_GENRES.length} categories`;
  } else if (config.type === 'hub_languages') {
    title = 'All Languages';
    subtitle = `${POPULAR_LANGUAGES.length} regional & global languages`;
  }

  return (
    <View style={styles.root}>
      {/* Header with Safe Area Padding */}
      <View
        style={[
          styles.header,
          { paddingTop: topInset + (isWide ? 14 : 10) },
          isWide && styles.headerWide,
        ]}>
        <TVFocusable
          ref={backBtnRef}
          style={[styles.backBtn, isWide && styles.backBtnWide]}
          focusedStyle={styles.btnFocused}
          hasTVPreferredFocus={true}
          onPressDown={() => {
            if (hasStudioTabs) {
              if (studioTab === 'movie') movieTabRef.current?.focus?.();
              else if (studioTab === 'tv') tvTabRef.current?.focus?.();
              else allTabRef.current?.focus?.();
            } else {
              firstItemRef.current?.focus?.();
            }
          }}
          onPress={onBack}>
          <BackArrowIcon size={isWide ? 20 : 18} color="#FFFFFF" />
        </TVFocusable>

        <View style={styles.titleWrap}>
          {config.type === 'studio' && config.studio.logoUrl && !logoError ? (
            <Image
              source={{ uri: config.studio.logoUrl }}
              style={[
                styles.headerLogoImg,
                isWide && styles.headerLogoImgWide,
              ]}
              resizeMode="contain"
              onError={() => setLogoError(true)}
            />
          ) : (
            <Text
              style={[
                styles.titleText,
                isWide && styles.titleTextWide,
                config.type === 'studio' && config.studio.color ? { color: config.studio.color } : null,
              ]}>
              {title}
            </Text>
          )}
          {subtitle ? (
            <Text style={[styles.subTitleText, isWide && styles.subTitleTextWide]} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Studio Content Filter Tabs (All / Movies / TV Shows) */}
      {hasStudioTabs && (
        <View style={[styles.tabBarContainer, isWide && styles.tabBarContainerWide]}>
          <TVFocusable
            ref={allTabRef}
            style={[styles.tabPill, isWide && styles.tabPillWide, studioTab === 'all' && styles.tabPillActive]}
            focusedStyle={styles.tabPillFocused}
            onPressUp={() => backBtnRef.current?.focus?.()}
            onPressDown={() => firstItemRef.current?.focus?.()}
            onPressRight={() => movieTabRef.current?.focus?.()}
            onPress={() => handleSelectStudioTab('all')}>
            <Text style={[styles.tabText, isWide && styles.tabTextWide, studioTab === 'all' && styles.tabTextActive]}>
              All
            </Text>
          </TVFocusable>

          <TVFocusable
            ref={movieTabRef}
            style={[styles.tabPill, isWide && styles.tabPillWide, studioTab === 'movie' && styles.tabPillActive]}
            focusedStyle={styles.tabPillFocused}
            onPressUp={() => backBtnRef.current?.focus?.()}
            onPressDown={() => firstItemRef.current?.focus?.()}
            onPressLeft={() => allTabRef.current?.focus?.()}
            onPressRight={() => tvTabRef.current?.focus?.()}
            onPress={() => handleSelectStudioTab('movie')}>
            <Text style={[styles.tabText, isWide && styles.tabTextWide, studioTab === 'movie' && styles.tabTextActive]}>
              Movies
            </Text>
          </TVFocusable>

          <TVFocusable
            ref={tvTabRef}
            style={[styles.tabPill, isWide && styles.tabPillWide, studioTab === 'tv' && styles.tabPillActive]}
            focusedStyle={styles.tabPillFocused}
            onPressUp={() => backBtnRef.current?.focus?.()}
            onPressDown={() => firstItemRef.current?.focus?.()}
            onPressLeft={() => movieTabRef.current?.focus?.()}
            onPress={() => handleSelectStudioTab('tv')}>
            <Text style={[styles.tabText, isWide && styles.tabTextWide, studioTab === 'tv' && styles.tabTextActive]}>
              TV Shows
            </Text>
          </TVFocusable>
        </View>
      )}

      {/* Main Body */}
      <View style={styles.contentWrap}>
        {config.type === 'hub_studios' && (
          <ScrollView
            contentContainerStyle={[
              styles.gridContent,
              isWide && styles.gridContentWide,
            ]}
            showsVerticalScrollIndicator={false}>
            <View style={styles.gridRow}>
              {POPULAR_STUDIOS.map((studio, index) => (
                <HubStudioCard
                  key={`hub-studio-${studio.id}`}
                  ref={index === 0 ? firstItemRef : undefined}
                  studio={studio}
                  index={index}
                  isTV={isTV}
                  onPressUp={index < 4 ? () => backBtnRef.current?.focus?.() : undefined}
                  onPress={() => onNavigateListing({ type: 'studio', studio })}
                />
              ))}
            </View>
          </ScrollView>
        )}

        {config.type === 'hub_genres' && (
          <ScrollView
            contentContainerStyle={[
              styles.gridContent,
              isWide && styles.gridContentWide,
            ]}
            showsVerticalScrollIndicator={false}>
            <View style={styles.gridRow}>
              {POPULAR_GENRES.map((genre, index) => (
                <HubGenreCard
                  key={`hub-genre-${genre.id}`}
                  ref={index === 0 ? firstItemRef : undefined}
                  genre={genre}
                  index={index}
                  isTV={isTV}
                  onPressUp={index === 0 ? () => backBtnRef.current?.focus?.() : undefined}
                  onPress={() => onNavigateListing({ type: 'genre', genre })}
                />
              ))}
            </View>
          </ScrollView>
        )}

        {config.type === 'hub_languages' && (
          <ScrollView
            contentContainerStyle={[
              styles.gridContent,
              isWide && styles.gridContentWide,
            ]}
            showsVerticalScrollIndicator={false}>
            <View style={styles.gridRow}>
              {POPULAR_LANGUAGES.map((lang, index) => (
                <HubLanguageCard
                  key={`hub-lang-${lang.code}`}
                  ref={index === 0 ? firstItemRef : undefined}
                  lang={lang}
                  index={index}
                  isTV={isTV}
                  onPressUp={index === 0 ? () => backBtnRef.current?.focus?.() : undefined}
                  onPress={() => onNavigateListing({ type: 'language', language: lang })}
                />
              ))}
            </View>
          </ScrollView>
        )}

        {/* Media Item Grid (Studios, Genres, Languages, Feed Rails) */}
        {!config.type.startsWith('hub_') && (
          loading && items.length === 0 ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.loadingText}>Loading titles...</Text>
            </View>
          ) : (
            <PosterGrid
              items={items}
              loading={loading}
              refreshing={refreshing}
              loadingMore={loadingMore}
              disableSidebarFocus={true}
              onPressUpFirstRow={() => {
                if (hasStudioTabs) {
                  if (studioTab === 'movie') movieTabRef.current?.focus?.();
                  else if (studioTab === 'tv') tvTabRef.current?.focus?.();
                  else allTabRef.current?.focus?.();
                } else {
                  backBtnRef.current?.focus?.();
                }
              }}
              onRefresh={() => {
                setRefreshing(true);
                loadData(1, false, studioTab);
              }}
              onLoadMore={() => {
                if (!loading && !loadingMore && !isFetchingMoreRef.current && hasMoreRef.current && items.length >= 10) {
                  loadData(pageRef.current + 1, true, studioTab);
                }
              }}
              onSelectMedia={onSelectMedia}
              emptyText={
                studioTab === 'movie'
                  ? `No movies currently found for ${title}`
                  : studioTab === 'tv'
                  ? `No TV series currently found for ${title}`
                  : `No titles currently found for ${title}`
              }
            />
          )
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#040406',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#07080D',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerWide: {
    paddingHorizontal: 28,
    paddingBottom: 16,
    gap: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  backBtnWide: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  btnFocused: {
    borderColor: '#FFFFFF',
    borderWidth: 2,
    transform: [{ scale: 1.1 }],
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  arrowContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  arrowStem: {
    position: 'absolute',
    right: 2,
    height: 2.2,
    borderRadius: 1,
  },
  arrowHead: {
    position: 'absolute',
    left: 2,
    borderLeftWidth: 2.2,
    borderBottomWidth: 2.2,
    transform: [{ rotate: '45deg' }],
  },
  titleWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  titleTextWide: {
    fontSize: 24,
    letterSpacing: 0.6,
  },
  subTitleText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  subTitleTextWide: {
    fontSize: 14,
    marginTop: 3,
  },
  headerLogoImg: {
    width: 140,
    height: 38,
    alignSelf: 'flex-start',
  },
  headerLogoImgWide: {
    width: 180,
    height: 46,
  },
  contentWrap: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  gridContent: {
    padding: 16,
    paddingBottom: 40,
  },
  gridContentWide: {
    padding: 28,
    paddingBottom: 60,
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    justifyContent: 'space-between',
  },
  genreCard: {
    width: '47.5%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    backgroundColor: '#07080D',
  },
  genreCardTV: {
    width: '23%',
    borderRadius: 14,
  },
  genreInner: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  studioItemWrap: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 16,
  },
  studioItemWrapTV: {
    width: '18%',
    marginBottom: 20,
  },
  studioCard: {
    width: 80,
    height: 80,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#000000',
  },
  studioCardTV: {
    width: 96,
    height: 96,
    borderRadius: 20,
  },
  studioLogo: {
    width: '100%',
    height: '100%',
  },
  logoPaddedWrap: {
    flex: 1,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoPaddedWrapTV: {
    padding: 14,
  },
  studioLogoContain: {
    width: '100%',
    height: '100%',
  },
  studioLabel: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    textAlign: 'center',
    width: '100%',
  },
  studioLabelTV: {
    fontSize: 13,
    marginTop: 10,
  },
  studioLabelFocused: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  fallbackWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
  },
  cardImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  fallbackText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
  },
  cardFocused: {
    zIndex: 10,
  },
  tabBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 10,
  },
  tabBarContainerWide: {
    paddingHorizontal: 28,
    paddingBottom: 14,
    gap: 12,
  },
  tabPill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  tabPillWide: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 22,
  },
  tabPillActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  tabPillFocused: {
    borderColor: '#FFFFFF',
    borderWidth: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    transform: [{ scale: 1.08 }],
  },
  tabText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  tabTextWide: {
    fontSize: 14,
  },
  tabTextActive: {
    color: '#050508',
    fontWeight: '900',
  },
});
