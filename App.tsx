import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, StatusBar, BackHandler, StyleSheet } from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

// Services & Models
import {
  MediaItem,
  CategoryFilter,
  HomeFeedData,
  StudioInfo,
  fetchHomeFeed,
  fetchCategoryItems,
  searchContent,
} from './src/services/tmdb';

import { TopNavbar } from './src/components/navigation/TopNavbar';
import { BottomTabBar, NavTab } from './src/components/navigation/BottomTabBar';
import { SplashScreen } from './src/components/common/SplashScreen';

// Screens
import { HomeScreen } from './src/screens/HomeScreen';
import { CatalogScreen } from './src/screens/CatalogScreen';
import { SearchScreen, SearchFilterType } from './src/screens/SearchScreen';
import { DetailScreen } from './src/screens/DetailScreen';

// Streaming & Playback
import { PlayerScreen } from './src/screens/PlayerScreen';
import { providerManager, StreamSource } from './src/services/providers';

// Modals
import { WatchlistModal } from './src/components/modals/WatchlistModal';
import { StudioContentModal } from './src/components/modals/StudioContentModal';
import { UpdateModal } from './src/components/modals/UpdateModal';
import { checkForAppUpdate, UpdateInfo } from './src/services/updater';

// Subcategories Configuration
import { SubCategory } from './src/components/catalog/CategoryPills';

function getSubCategoriesForTab(tab: 'movie' | 'tv' | 'anime'): SubCategory[] {
  if (tab === 'movie') {
    return [
      { id: 'trending', label: 'Trending' },
      { id: 'popular', label: 'Popular' },
      { id: 'top_rated', label: 'Top Rated' },
      { id: 'extra', label: 'In Theatres' },
    ];
  } else if (tab === 'tv') {
    return [
      { id: 'trending', label: 'Trending' },
      { id: 'popular', label: 'Popular' },
      { id: 'top_rated', label: 'Top Rated' },
      { id: 'extra', label: 'Airing Today' },
    ];
  } else {
    // anime
    return [
      { id: 'trending', label: 'Top Anime' },
      { id: 'popular', label: 'Popular' },
      { id: 'top_rated', label: 'Top Movies' },
      { id: 'extra', label: 'Current Season' },
    ];
  }
}

export function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" />
      <MainAppContent />
    </SafeAreaProvider>
  );
}

function MainAppContent(): React.JSX.Element {
  const insets = useSafeAreaInsets();

  // Navigation State
  const [currentTab, setCurrentTab] = useState<NavTab>('home');

  // Home State
  const [homeData, setHomeData] = useState<HomeFeedData | null>(null);
  const [homeLoading, setHomeLoading] = useState(true);
  const [homeRefreshing, setHomeRefreshing] = useState(false);
  const [splashMounted, setSplashMounted] = useState(true);
  const handleSplashFinish = useCallback(() => setSplashMounted(false), []);

  // Catalog State
  const [gridItems, setGridItems] = useState<MediaItem[]>([]);
  const [activeSubCat, setActiveSubCat] = useState<CategoryFilter>('trending');
  const [gridPage, setGridPage] = useState(1);
  const [gridLoading, setGridLoading] = useState(false);
  const [gridLoadingMore, setGridLoadingMore] = useState(false);
  const [gridRefreshing, setGridRefreshing] = useState(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<SearchFilterType>('all');
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Watchlist State
  const [watchlist, setWatchlist] = useState<MediaItem[]>([]);
  const [watchlistModalVisible, setWatchlistModalVisible] = useState(false);

  // App Update State
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);

  // Scroll Navbar Visibility State
  const [navbarVisible, setNavbarVisible] = useState(true);
  const lastScrollY = useRef(0);

  const handleScroll = useCallback((event: any) => {
    const currentOffset = event?.nativeEvent?.contentOffset?.y ?? 0;
    const diff = currentOffset - lastScrollY.current;

    if (currentOffset <= 20) {
      setNavbarVisible(true);
    } else if (diff > 12 && currentOffset > 60) {
      setNavbarVisible(false); // scrolling down
    } else if (diff < -10) {
      setNavbarVisible(true);  // scrolling up
    }

    lastScrollY.current = currentOffset;
  }, []);

  // Studio / Network Hub State
  const [selectedStudio, setSelectedStudio] = useState<StudioInfo | null>(null);

  // Details Page State
  const [detailMedia, setDetailMedia] = useState<MediaItem | null>(null);

  // Active Playback State
  const [activePlayback, setActivePlayback] = useState<{
    media: MediaItem;
    source: StreamSource;
    allSources?: StreamSource[];
    season?: number;
    episode?: number;
  } | null>(null);

  // Open Details Page when clicking on an item
  const handleOpenDetailMedia = useCallback((item: MediaItem) => {
    setDetailMedia(item);
  }, []);

  const handleCloseDetailMedia = useCallback(() => {
    setDetailMedia(null);
  }, []);

  // Direct Play (Starts playing Native player by default if found, else Embed)
  const handleDirectPlayMedia = useCallback(async (item: MediaItem, startSeason = 1, startEpisode = 1) => {
    // 1. Create default embed source as instant placeholder while resolving
    const defaultEmbedSource: StreamSource = {
      id: 'embed_vidlink_' + item.id + (item.type === 'tv' ? `_s${startSeason}_e${startEpisode}` : ''),
      name: 'Server 1: VidLink HD',
      quality: '1080p',
      format: 'embed',
      url:
        item.type === 'tv'
          ? `https://vidlink.pro/tv/${item.id}/${startSeason}/${startEpisode}`
          : `https://vidlink.pro/movie/${item.id}`,
      size: item.type === 'tv' ? `S${startSeason} E${startEpisode}` : '1080p Full Movie',
      resolution: '1920x1080',
    };

    setActivePlayback({
      media: item,
      source: defaultEmbedSource,
      allSources: [defaultEmbedSource],
      season: startSeason,
      episode: startEpisode,
    });

    // 2. Resolve all available servers (prioritizing Native MP4/HLS streams)
    try {
      const sources = await providerManager.getStreams({
        title: item.title,
        year: item.year,
        type: item.type === 'tv' ? 'tv' : 'movie',
        tmdbId: item.id,
        season: item.type === 'tv' ? startSeason : undefined,
        episode: item.type === 'tv' ? startEpisode : undefined,
      });

      if (sources && sources.length > 0) {
        // Pick native direct stream if available, otherwise fallback to top embed
        const nativeSource = sources.find(s => s.format !== 'embed');
        const chosenSource = nativeSource || sources[0];

        setActivePlayback(prev => {
          if (!prev || prev.media.id !== item.id) return prev;
          return {
            ...prev,
            source: chosenSource,
            allSources: sources,
          };
        });
      }
    } catch (err) {
      console.warn('Background stream resolver error:', err);
    }
  }, []);

  const handleSelectEpisode = useCallback(
    async (season: number, episode: number) => {
      setActivePlayback(prev => {
        if (!prev) return null;
        const item = prev.media;

        const defaultEmbedSource: StreamSource = {
          id: `embed_vidlink_${item.id}_s${season}_e${episode}`,
          name: 'Server 1: VidLink HD',
          quality: '1080p',
          format: 'embed',
          url: `https://vidlink.pro/tv/${item.id}/${season}/${episode}`,
          size: `S${season} E${episode}`,
          resolution: '1920x1080',
        };

        return {
          media: item,
          source: defaultEmbedSource,
          allSources: [defaultEmbedSource],
          season,
          episode,
        };
      });

      if (!activePlayback) return;
      const item = activePlayback.media;

      try {
        const sources = await providerManager.getStreams({
          title: item.title,
          year: item.year,
          type: 'tv',
          tmdbId: item.id,
          season,
          episode,
        });

        if (sources && sources.length > 0) {
          const nativeSource = sources.find(s => s.format !== 'embed');
          const chosenSource = nativeSource || sources[0];

          setActivePlayback(prev => {
            if (!prev || prev.media.id !== item.id) return prev;
            return {
              ...prev,
              source: chosenSource,
              allSources: sources,
            };
          });
        }
      } catch (err) {
        console.warn('Failed to resolve episode streams:', err);
      }
    },
    [activePlayback]
  );

  const handleSwitchServer = (source: StreamSource) => {
    setActivePlayback(prev => {
      if (!prev) return null;
      return {
        ...prev,
        source,
      };
    });
  };

  // 1. Fetch Home Feed
  const loadHomeFeed = useCallback(async () => {
    try {
      setHomeRefreshing(true);
      const data = await fetchHomeFeed();
      setHomeData(data);
    } catch (err) {
      console.error('Failed to load home feed:', err);
    } finally {
      setHomeLoading(false);
      setHomeRefreshing(false);
    }
  }, []);

  // 2. Fetch Catalog Feed (Movies, Series, Anime)
  const loadCatalogData = useCallback(
    async (
      tab: 'movie' | 'tv' | 'anime',
      subCat: CategoryFilter,
      targetPage = 1,
      append = false
    ) => {
      try {
        if (!append) setGridLoading(true);
        else setGridLoadingMore(true);

        const data = await fetchCategoryItems(tab, subCat, targetPage);
        if (append) {
          setGridItems(prev => {
            const seen = new Set(prev.map(i => i.id));
            const fresh = data.filter(i => !seen.has(i.id));
            return [...prev, ...fresh];
          });
        } else {
          setGridItems(data);
        }
        setGridPage(targetPage);
      } catch (err) {
        console.error('Catalog fetch error:', err);
      } finally {
        setGridLoading(false);
        setGridLoadingMore(false);
        setGridRefreshing(false);
      }
    },
    []
  );

  // Initial home feed fetch & Background Update Check
  useEffect(() => {
    loadHomeFeed();

    // Check for updates in the background after app load
    const timer = setTimeout(async () => {
      try {
        const update = await checkForAppUpdate();
        if (update) {
          setUpdateInfo(update);
        }
      } catch (_) {}
    }, 3000);

    return () => clearTimeout(timer);
  }, [loadHomeFeed]);

  // Catalog tab / subcategory changes
  useEffect(() => {
    if (currentTab === 'movie' || currentTab === 'tv' || currentTab === 'anime') {
      loadCatalogData(currentTab, activeSubCat, 1, false);
    }
  }, [currentTab, activeSubCat, loadCatalogData]);

  // Hardware Back Button (Essential for Android TV Remote Back Key)
  useEffect(() => {
    const onBackPress = () => {
      if (activePlayback) {
        setActivePlayback(null);
        return true;
      }
      if (detailMedia) {
        setDetailMedia(null);
        return true;
      }
      if (selectedStudio) {
        setSelectedStudio(null);
        return true;
      }
      if (watchlistModalVisible) {
        setWatchlistModalVisible(false);
        return true;
      }
      if (currentTab !== 'home') {
        setCurrentTab('home');
        return true;
      }
      return false; // Allow standard exit when on home
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [activePlayback, detailMedia, selectedStudio, watchlistModalVisible, currentTab]);

  // Tab switch handler
  const handleTabSwitch = useCallback((tab: NavTab) => {
    setCurrentTab(tab);
    setDetailMedia(null);
    setNavbarVisible(true);
    lastScrollY.current = 0;
    if (tab === 'movie' || tab === 'tv' || tab === 'anime') {
      setActiveSubCat('trending');
    }
  }, []);

  // Search handler
  const handleSearchChange = useCallback(async (text: string, type = searchType) => {
    setSearchQuery(text);
    if (!text.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      setSearchLoading(true);
      const res = await searchContent(text, type);
      setSearchResults(res);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearchLoading(false);
    }
  }, [searchType]);

  // Watchlist toggle
  const toggleWatchlist = useCallback((item: MediaItem) => {
    setWatchlist(prev => {
      const exists = prev.some(i => i.id === item.id);
      return exists ? prev.filter(i => i.id !== item.id) : [item, ...prev];
    });
  }, []);

  const watchlistIds = useMemo(() => new Set(watchlist.map(i => i.id)), [watchlist]);
  const isInWatchlist = useCallback((id: number) => watchlistIds.has(id), [watchlistIds]);

  const handleSelectStudio = useCallback((studio: StudioInfo | null) => {
    setSelectedStudio(studio);
  }, []);

  const handleCloseWatchlistModal = useCallback(() => setWatchlistModalVisible(false), []);
  const handleCloseStudioModal = useCallback(() => setSelectedStudio(null), []);
  const handleClosePlayback = useCallback(() => setActivePlayback(null), []);

  const subCategories = useMemo(() => {
    if (currentTab === 'movie' || currentTab === 'tv' || currentTab === 'anime') {
      return getSubCategoriesForTab(currentTab);
    }
    return [];
  }, [currentTab]);

  return (
    <View style={styles.root}>
      {/* 1. Global Top Navigation (Hidden during video playback and on detail screen) */}
      {!activePlayback && !detailMedia && (
        <TopNavbar
          topInset={insets.top}
          visible={navbarVisible}
        />
      )}

      {/* 2. Screen Composition */}
      <View style={styles.screenContainer}>
        {activePlayback ? (
          <PlayerScreen
            media={activePlayback.media}
            source={activePlayback.source}
            availableSources={activePlayback.allSources}
            season={activePlayback.season || 1}
            episode={activePlayback.episode || 1}
            topInset={insets.top}
            onClose={handleClosePlayback}
            onSelectSource={handleSwitchServer}
            onSelectRelatedMedia={handleDirectPlayMedia}
            onSelectEpisode={handleSelectEpisode}
            onToggleWatchlist={toggleWatchlist}
            isInWatchlist={isInWatchlist(activePlayback.media.id)}
          />
        ) : detailMedia ? (
          <DetailScreen
            media={detailMedia}
            topInset={insets.top}
            bottomInset={insets.bottom}
            onBack={handleCloseDetailMedia}
            onPlay={handleDirectPlayMedia}
            onToggleWatchlist={toggleWatchlist}
            isInWatchlist={isInWatchlist(detailMedia.id)}
            onSelectMedia={handleOpenDetailMedia}
          />
        ) : (
          <>
            {currentTab === 'home' && (
              <HomeScreen
                homeData={homeData}
                loading={homeLoading}
                refreshing={homeRefreshing}
                topInset={insets.top}
                onRefresh={loadHomeFeed}
                onSelectMedia={handleOpenDetailMedia}
                onSelectStudio={handleSelectStudio}
                onToggleWatchlist={toggleWatchlist}
                isInWatchlist={isInWatchlist}
                onScroll={handleScroll}
              />
            )}

            {(currentTab === 'movie' || currentTab === 'tv' || currentTab === 'anime') && (
              <CatalogScreen
                categories={subCategories}
                activeCategory={activeSubCat}
                items={gridItems}
                loading={gridLoading}
                refreshing={gridRefreshing}
                loadingMore={gridLoadingMore}
                topInset={insets.top}
                onSelectCategory={setActiveSubCat}
                onRefresh={() => {
                  setGridRefreshing(true);
                  loadCatalogData(currentTab, activeSubCat, 1, false);
                }}
                onLoadMore={() => {
                  if (!gridLoading && !gridLoadingMore) {
                    loadCatalogData(currentTab, activeSubCat, gridPage + 1, true);
                  }
                }}
                onSelectMedia={handleOpenDetailMedia}
                onScroll={handleScroll}
              />
            )}

            {currentTab === 'search' && (
              <SearchScreen
                searchQuery={searchQuery}
                searchType={searchType}
                searchResults={searchResults}
                suggestions={homeData?.trendingMovies?.slice(0, 15) || []}
                loading={searchLoading}
                topInset={insets.top}
                onSearchChange={handleSearchChange}
                onTypeChange={t => {
                  setSearchType(t);
                  if (searchQuery.trim()) {
                    handleSearchChange(searchQuery, t);
                  }
                }}
                onSelectMedia={handleOpenDetailMedia}
                onScroll={handleScroll}
              />
            )}
          </>
        )}
      </View>

      {/* 3. Global Bottom Tab Navigation (Always visible except during full playback) */}
      {!activePlayback && (
        <BottomTabBar
          currentTab={currentTab}
          onTabSelect={handleTabSwitch}
          bottomInset={insets.bottom}
        />
      )}

      {/* 4. Watchlist Modal */}
      <WatchlistModal
        visible={watchlistModalVisible}
        watchlist={watchlist}
        onClose={handleCloseWatchlistModal}
        onSelectMedia={handleOpenDetailMedia}
      />

      {/* 5. Studio / Network Hub Catalog Modal */}
      <StudioContentModal
        visible={!!selectedStudio}
        studio={selectedStudio}
        onClose={handleCloseStudioModal}
        onSelectMedia={handleOpenDetailMedia}
      />

      {/* 6. App Update Notification Modal */}
      <UpdateModal
        visible={!!updateInfo}
        updateInfo={updateInfo}
        onDismiss={() => setUpdateInfo(null)}
      />

      {/* 8. Animated In-App Splash Screen */}
      {splashMounted && (
        <SplashScreen
          isReady={!homeLoading && !!homeData}
          onFinish={handleSplashFinish}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#040406',
  },
  screenContainer: {
    flex: 1,
  },
});

export default App;
