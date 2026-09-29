import React, { useState, memo, useCallback } from 'react';
import { View, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { MediaItem, HomeFeedData, StudioInfo } from '../services/tmdb';
import { HomeBillboard } from '../components/home/HomeBillboard';
import { StudioRail } from '../components/home/StudioRail';
import { GenreRail, GenreItem } from '../components/home/GenreRail';
import { LanguageRail, LanguageItem } from '../components/home/LanguageRail';
import { Top10Rail } from '../components/home/Top10Rail';
import { PosterRail } from '../components/home/PosterRail';
import { LandscapeRail } from '../components/home/LandscapeRail';
import { HomeSkeleton } from '../components/skeletons/HomeSkeleton';
import { GenreContentModal } from '../components/modals/GenreContentModal';
import { LanguageContentModal } from '../components/modals/LanguageContentModal';
import { FeedSectionModal } from '../components/modals/FeedSectionModal';
import { CategoryGridModal, CategoryGridType } from '../components/modals/CategoryGridModal';

interface HomeScreenProps {
  homeData: HomeFeedData | null;
  loading?: boolean;
  refreshing: boolean;
  topInset: number;
  onRefresh: () => void;
  onSelectMedia: (item: MediaItem) => void;
  onSelectStudio: (studio: StudioInfo) => void;
  onToggleWatchlist: (item: MediaItem) => void;
  isInWatchlist: (id: number) => boolean;
  onScroll?: (e: any) => void;
}

export const HomeScreen = memo(function HomeScreen({
  homeData,
  loading = false,
  refreshing,
  topInset,
  onRefresh,
  onSelectMedia,
  onSelectStudio,
  onToggleWatchlist,
  isInWatchlist,
  onScroll,
}: HomeScreenProps) {
  const [selectedGenre, setSelectedGenre] = useState<GenreItem | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageItem | null>(null);
  const [categoryGridType, setCategoryGridType] = useState<CategoryGridType | null>(null);
  const [feedModalSection, setFeedModalSection] = useState<{ title: string; items: MediaItem[] } | null>(null);

  const handleOpenStudiosGrid = useCallback(() => setCategoryGridType('studios'), []);
  const handleOpenGenresGrid = useCallback(() => setCategoryGridType('genres'), []);
  const handleOpenLanguagesGrid = useCallback(() => setCategoryGridType('languages'), []);

  const handleCloseGenreModal = useCallback(() => setSelectedGenre(null), []);
  const handleCloseLanguageModal = useCallback(() => setSelectedLanguage(null), []);
  const handleCloseCategoryGrid = useCallback(() => setCategoryGridType(null), []);
  const handleCloseFeedModal = useCallback(() => setFeedModalSection(null), []);

  const handleViewAllTop10Week = useCallback(() => {
    setFeedModalSection({
      title: 'Top 10 This Week',
      items: homeData?.top10Week || homeData?.top10 || [],
    });
  }, [homeData]);

  const handleViewAllTop10TV = useCallback(() => {
    setFeedModalSection({
      title: 'Top 10 TV Shows',
      items: homeData?.top10TV || [],
    });
  }, [homeData]);

  const handleViewAllTop10Movies = useCallback(() => {
    setFeedModalSection({
      title: 'Top 10 Movies',
      items: homeData?.top10Movies || [],
    });
  }, [homeData]);

  const handleViewAllTopRatedSeries = useCallback(() => {
    setFeedModalSection({
      title: 'Top Rated Series',
      items: homeData?.topRatedSeries || [],
    });
  }, [homeData]);

  const handleViewAllTrendingMovies = useCallback(() => {
    setFeedModalSection({
      title: 'Trending Movies',
      items: homeData?.trendingMovies || [],
    });
  }, [homeData]);

  const handleViewAllBlockbusters = useCallback(() => {
    setFeedModalSection({
      title: 'Critically Acclaimed & Blockbusters',
      items: homeData?.blockbusters || [],
    });
  }, [homeData]);

  const handleViewAllPopularSeries = useCallback(() => {
    setFeedModalSection({
      title: 'Popular TV Series',
      items: homeData?.popularSeries || [],
    });
  }, [homeData]);

  const handleViewAllTopAnime = useCallback(() => {
    setFeedModalSection({
      title: 'Top Japanese Anime',
      items: homeData?.topAnime || [],
    });
  }, [homeData]);

  if ((loading || !homeData) && !refreshing) {
    return <HomeSkeleton topInset={topInset} />;
  }

  return (
    <>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        scrollEventThrottle={16}
        onScroll={onScroll}
        removeClippedSubviews={false}
        overScrollMode="never"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" />
        }>
        {/* 1. Full-bleed Auto-Scrolling Hero Billboard with Title Logo Artwork */}
        <HomeBillboard
          heroes={homeData?.heroBillboard || []}
          topInset={topInset}
          onSelectMedia={onSelectMedia}
          onToggleWatchlist={onToggleWatchlist}
          isInWatchlist={isInWatchlist}
        />

        {/* 2. Featured Studios & Channels (Netflix, Prime, Disney+, Apple TV+, CN, etc.) */}
        <StudioRail
          onSelectStudio={onSelectStudio}
          onViewAll={handleOpenStudiosGrid}
        />

        {/* 3. Top 10 This Week */}
        <Top10Rail
          title="Top 10 This Week"
          subTitle="Trending Global"
          items={homeData?.top10Week || homeData?.top10 || []}
          onSelectMedia={onSelectMedia}
          onViewAll={handleViewAllTop10Week}
        />

        {/* 4. Top 10 TV Shows */}
        <Top10Rail
          title="Top 10 TV Shows"
          subTitle="Binge Hits"
          items={homeData?.top10TV || []}
          onSelectMedia={onSelectMedia}
          onViewAll={handleViewAllTop10TV}
        />

        {/* 5. Top 10 Movies */}
        <Top10Rail
          title="Top 10 Movies"
          subTitle="Box Office"
          items={homeData?.top10Movies || []}
          onSelectMedia={onSelectMedia}
          onViewAll={handleViewAllTop10Movies}
        />

        {/* 6. Popular Genres (Bingr style) */}
        <GenreRail
          onSelectGenre={setSelectedGenre}
          onViewAll={handleOpenGenresGrid}
        />

        {/* 7. Top Rated Series */}
        <LandscapeRail
          title="Top Rated Series"
          subTitle="Critically Acclaimed"
          items={homeData?.topRatedSeries || []}
          onSelectMedia={onSelectMedia}
          onViewAll={handleViewAllTopRatedSeries}
        />

        {/* 8. Trending Movies Horizontal Rail */}
        <PosterRail
          title="Trending Movies"
          items={homeData?.trendingMovies || []}
          badgeText="HOT"
          onSelectMedia={onSelectMedia}
          onViewAll={handleViewAllTrendingMovies}
        />

        {/* 9. Amazon Prime Video Style Widescreen Rail */}
        <LandscapeRail
          title="Critically Acclaimed & Blockbusters"
          items={homeData?.blockbusters || []}
          subTitle="Prime Picks"
          onSelectMedia={onSelectMedia}
          onViewAll={handleViewAllBlockbusters}
        />

        {/* 10. Popular TV Series Rail */}
        <PosterRail
          title="Popular Series"
          items={homeData?.popularSeries || []}
          onSelectMedia={onSelectMedia}
          onViewAll={handleViewAllPopularSeries}
        />

        {/* 11. Top Japanese Anime Rail */}
        <PosterRail
          title="Top Anime"
          items={homeData?.topAnime || []}
          badgeText="SUB/DUB"
          onSelectMedia={onSelectMedia}
          onViewAll={handleViewAllTopAnime}
        />

        {/* 12. Popular Languages (Bingr style - at the end) */}
        <LanguageRail
          onSelectLanguage={setSelectedLanguage}
          onViewAll={handleOpenLanguagesGrid}
        />

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Genre Catalog Explorer Modal */}
      <GenreContentModal
        visible={!!selectedGenre}
        genre={selectedGenre}
        onClose={handleCloseGenreModal}
        onSelectMedia={onSelectMedia}
      />

      {/* Language Catalog Explorer Modal */}
      <LanguageContentModal
        visible={!!selectedLanguage}
        language={selectedLanguage}
        onClose={handleCloseLanguageModal}
        onSelectMedia={onSelectMedia}
      />

      {/* Category Grid Explorer Modal (All Genres, All Languages, All Channels) */}
      <CategoryGridModal
        visible={!!categoryGridType}
        type={categoryGridType || 'genres'}
        onClose={handleCloseCategoryGrid}
        onSelectGenre={setSelectedGenre}
        onSelectLanguage={setSelectedLanguage}
        onSelectStudio={onSelectStudio}
      />

      {/* Feed Section View All Modal (For movie/TV feeds) */}
      <FeedSectionModal
        visible={!!feedModalSection}
        title={feedModalSection?.title || ''}
        items={feedModalSection?.items || []}
        onClose={handleCloseFeedModal}
        onSelectMedia={onSelectMedia}
      />
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
