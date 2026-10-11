import React, { useState, useRef, memo, useCallback } from 'react';
import { View, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { MediaItem, HomeFeedData, StudioInfo } from '../services/tmdb';
import { HomeBillboard } from '../components/home/HomeBillboard';
import { StudioRail } from '../components/home/StudioRail';
import { GenreRail, GenreItem } from '../components/home/GenreRail';
import { LanguageRail, LanguageItem } from '../components/home/LanguageRail';
import { Top10Rail } from '../components/home/Top10Rail';
import { PosterRail } from '../components/home/PosterRail';
import { LandscapeRail } from '../components/home/LandscapeRail';
import { HistoryRail } from '../components/home/HistoryRail';
import { HomeSkeleton } from '../components/skeletons/HomeSkeleton';
import { ListingViewConfig } from './ListingScreen';
import { WatchHistoryItem } from '../services/history';

interface HomeScreenProps {
  homeData: HomeFeedData | null;
  watchHistory: WatchHistoryItem[];
  loading?: boolean;
  refreshing: boolean;
  topInset: number;
  onRefresh: () => void;
  onSelectMedia: (item: MediaItem) => void;
  onPlayMedia?: (item: MediaItem, season?: number, episode?: number) => void;
  onOpenListing: (config: ListingViewConfig) => void;
  onToggleWatchlist: (item: MediaItem) => void;
  isInWatchlist: (id: number) => boolean;
  onScroll?: (e: any) => void;
}

export const HomeScreen = memo(function HomeScreenComponent({
  homeData,
  watchHistory,
  loading = false,
  refreshing,
  topInset,
  onRefresh,
  onSelectMedia,
  onPlayMedia,
  onOpenListing,
  onToggleWatchlist,
  isInWatchlist,
  onScroll,
}: HomeScreenProps) {
  const handleOpenStudiosGrid = useCallback(() => onOpenListing({ type: 'hub_studios' }), [onOpenListing]);
  const handleOpenGenresGrid = useCallback(() => onOpenListing({ type: 'hub_genres' }), [onOpenListing]);
  const handleOpenLanguagesGrid = useCallback(() => onOpenListing({ type: 'hub_languages' }), [onOpenListing]);

  const handleSelectStudio = useCallback((studio: StudioInfo) => {
    onOpenListing({ type: 'studio', studio });
  }, [onOpenListing]);

  const handleSelectGenre = useCallback((genre: GenreItem) => {
    onOpenListing({ type: 'genre', genre });
  }, [onOpenListing]);

  const handleSelectLanguage = useCallback((language: LanguageItem) => {
    onOpenListing({ type: 'language', language });
  }, [onOpenListing]);

  const handleViewAllTrendingMovies = useCallback(() => {
    onOpenListing({
      type: 'feed',
      title: 'Trending Movies',
      feedKey: 'top10_movies',
      items: homeData?.top10Movies || [],
    });
  }, [homeData, onOpenListing]);

  const handleViewAllTrendingTV = useCallback(() => {
    onOpenListing({
      type: 'feed',
      title: 'Trending TV Shows',
      feedKey: 'top10_tv',
      items: homeData?.top10TV || [],
    });
  }, [homeData, onOpenListing]);

  const handleViewAllTopRatedSeries = useCallback(() => {
    onOpenListing({
      type: 'feed',
      title: 'Top Rated Series',
      feedKey: 'top_rated_series',
      items: homeData?.topRatedSeries || [],
    });
  }, [homeData, onOpenListing]);

  const handleViewAllPopularMovies = useCallback(() => {
    onOpenListing({
      type: 'feed',
      title: 'Popular Movies',
      feedKey: 'popular_movies',
      items: homeData?.trendingMovies || [],
    });
  }, [homeData, onOpenListing]);

  const handleViewAllBlockbusters = useCallback(() => {
    onOpenListing({
      type: 'feed',
      title: 'Critically Acclaimed & Blockbusters',
      feedKey: 'blockbusters',
      items: homeData?.blockbusters || [],
    });
  }, [homeData, onOpenListing]);

  const handleViewAllPopularSeries = useCallback(() => {
    onOpenListing({
      type: 'feed',
      title: 'Popular TV Series',
      feedKey: 'popular_series',
      items: homeData?.popularSeries || [],
    });
  }, [homeData, onOpenListing]);

  const handleViewAllTopAnime = useCallback(() => {
    onOpenListing({
      type: 'feed',
      title: 'Top Japanese Anime',
      feedKey: 'top_anime',
      items: homeData?.topAnime || [],
    });
  }, [homeData, onOpenListing]);

  const [isBannerInView, setIsBannerInView] = useState(true);
  const scrollViewRef = useRef<any>(null);
  const railYMap = useRef<{ [key: string]: number }>({});

  const handleRailLayout = useCallback((key: string, y: number) => {
    railYMap.current[key] = y;
  }, []);

  const handleRailFocus = useCallback((key: string) => {
    if (key === 'billboard') {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    const targetY = railYMap.current[key];
    if (targetY !== undefined && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        y: Math.max(0, targetY - 60),
        animated: true,
      });
    }
  }, []);

  const isBannerInViewRef = useRef(true);

  const handleScroll = useCallback(
    (e: any) => {
      const scrollY = e.nativeEvent?.contentOffset?.y ?? 0;
      // Pause billboard trailer when scrolled down past 220px
      const inView = scrollY < 220;
      if (inView !== isBannerInViewRef.current) {
        isBannerInViewRef.current = inView;
        setIsBannerInView(inView);
      }
      if (onScroll) {
        onScroll(e);
      }
    },
    [onScroll],
  );

  if ((loading || !homeData) && !refreshing) {
    return <HomeSkeleton topInset={topInset} />;
  }

  return (
    <>
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        scrollEventThrottle={32}
        onScroll={handleScroll}
        focusable={false}
        removeClippedSubviews={true}
        overScrollMode="never"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" />
        }>
        {/* 1. Full-bleed Auto-Scrolling Hero Billboard with Title Logo Artwork */}
        <HomeBillboard
          heroes={homeData?.heroBillboard || []}
          topInset={topInset}
          isBannerInView={isBannerInView}
          onSelectMedia={onSelectMedia}
          onToggleWatchlist={onToggleWatchlist}
          isInWatchlist={isInWatchlist}
          onFocus={() => handleRailFocus('billboard')}
        />

        {/* 1.5 Continue Watching (History) */}
        {watchHistory.length > 0 && (
          <View onLayout={e => handleRailLayout('history', e.nativeEvent.layout.y)}>
            <HistoryRail
              title="Continue Watching"
              items={watchHistory}
              onSelectMedia={onSelectMedia}
              onPlayMedia={onPlayMedia}
              onFocus={() => handleRailFocus('history')}
            />
          </View>
        )}

        {/* 2. Featured Studios & Channels (Netflix, Prime, Disney+, Apple TV+, CN, etc.) */}
        <View onLayout={e => handleRailLayout('studios', e.nativeEvent.layout.y)}>
          <StudioRail
            onSelectStudio={handleSelectStudio}
            onViewAll={handleOpenStudiosGrid}
            onFocus={() => handleRailFocus('studios')}
          />
        </View>

        {/* 3. Trending Movies (Top 10 Style) */}
        <View onLayout={e => handleRailLayout('trendingMovies', e.nativeEvent.layout.y)}>
          <Top10Rail
            title="Trending Movies"
            subTitle="Top 10"
            railId="top10_movies"
            items={homeData?.top10Movies || []}
            onSelectMedia={onSelectMedia}
            onViewAll={handleViewAllTrendingMovies}
            onFocus={() => handleRailFocus('trendingMovies')}
          />
        </View>

        {/* 4. Trending TV Shows (Top 10 Style) */}
        <View onLayout={e => handleRailLayout('trendingTV', e.nativeEvent.layout.y)}>
          <Top10Rail
            title="Trending TV Shows"
            subTitle="Top 10"
            railId="top10_tv"
            items={homeData?.top10TV || []}
            onSelectMedia={onSelectMedia}
            onViewAll={handleViewAllTrendingTV}
            onFocus={() => handleRailFocus('trendingTV')}
          />
        </View>

        {/* 5. Popular Genres (Bingr style) */}
        <View onLayout={e => handleRailLayout('genres', e.nativeEvent.layout.y)}>
          <GenreRail
            onSelectGenre={handleSelectGenre}
            onViewAll={handleOpenGenresGrid}
            onFocus={() => handleRailFocus('genres')}
          />
        </View>

        {/* 6. Top Rated Series */}
        <View onLayout={e => handleRailLayout('topRatedSeries', e.nativeEvent.layout.y)}>
          <LandscapeRail
            title="Top Rated Series"
            subTitle="Critically Acclaimed"
            railId="topRatedSeries"
            items={homeData?.topRatedSeries || []}
            onSelectMedia={onSelectMedia}
            onViewAll={handleViewAllTopRatedSeries}
            onFocus={() => handleRailFocus('topRatedSeries')}
          />
        </View>

        {/* 7. Popular Movies Horizontal Rail */}
        <View onLayout={e => handleRailLayout('popularMovies', e.nativeEvent.layout.y)}>
          <PosterRail
            title="Popular Movies"
            items={homeData?.trendingMovies || []}
            badgeText="HOT"
            railId="popularMovies"
            onSelectMedia={onSelectMedia}
            onViewAll={handleViewAllPopularMovies}
            onFocus={() => handleRailFocus('popularMovies')}
          />
        </View>

        {/* 9. Amazon Prime Video Style Widescreen Rail */}
        <View onLayout={e => handleRailLayout('blockbusters', e.nativeEvent.layout.y)}>
          <LandscapeRail
            title="Critically Acclaimed & Blockbusters"
            items={homeData?.blockbusters || []}
            subTitle="Prime Picks"
            railId="blockbusters"
            onSelectMedia={onSelectMedia}
            onViewAll={handleViewAllBlockbusters}
            onFocus={() => handleRailFocus('blockbusters')}
          />
        </View>

        {/* 10. Popular TV Series Rail */}
        <View onLayout={e => handleRailLayout('popularSeries', e.nativeEvent.layout.y)}>
          <PosterRail
            title="Popular Series"
            items={homeData?.popularSeries || []}
            railId="popularSeries"
            onSelectMedia={onSelectMedia}
            onViewAll={handleViewAllPopularSeries}
            onFocus={() => handleRailFocus('popularSeries')}
          />
        </View>

        {/* 11. Top Japanese Anime Rail */}
        <View onLayout={e => handleRailLayout('topAnime', e.nativeEvent.layout.y)}>
          <PosterRail
            title="Top Anime"
            items={homeData?.topAnime || []}
            badgeText="SUB/DUB"
            railId="topAnime"
            onSelectMedia={onSelectMedia}
            onViewAll={handleViewAllTopAnime}
            onFocus={() => handleRailFocus('topAnime')}
          />
        </View>

        {/* 12. Popular Languages (Bingr style - at the end) */}
        <View onLayout={e => handleRailLayout('languages', e.nativeEvent.layout.y)}>
          <LanguageRail
            onSelectLanguage={handleSelectLanguage}
            onViewAll={handleOpenLanguagesGrid}
            onFocus={() => handleRailFocus('languages')}
          />
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </>
  );
});

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 20,
  },
  bottomSpacer: {
    height: 90,
  },
});
