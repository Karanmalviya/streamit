import React, { useState, memo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  Platform,
} from 'react-native';
import { TVFocusable } from '../common/TVFocusable';
import { useDeviceMode } from '../../hooks/useDeviceMode';

export interface GenreItem {
  id: number;
  name: string;
  imageUrl: string;
  color: string;
  icon?: string;
}

export const POPULAR_GENRES: GenreItem[] = [
  {
    id: 10749,
    name: 'Romance',
    imageUrl: 'https://api.bingr.one/static/categories/1750239101112-a.webp',
    color: '#9F1239',
  },
  {
    id: 18,
    name: 'Drama',
    imageUrl: 'https://api.bingr.one/static/categories/1535285-a-88035ca1ae69.webp',
    color: '#115E59',
  },
  {
    id: 10751,
    name: 'Family',
    imageUrl: 'https://api.bingr.one/static/categories/1535284-a-656c6b45a905.webp',
    color: '#78350F',
  },
  {
    id: 10764,
    name: 'Reality',
    imageUrl: 'https://api.bingr.one/static/categories/1535264-a-9e7871687c76.webp',
    color: '#0369A1',
  },
  {
    id: 35,
    name: 'Comedy',
    imageUrl: 'https://api.bingr.one/static/categories/1535292-a-5739f9c84b63.webp',
    color: '#0E7490',
  },
  {
    id: 14,
    name: 'Mythology',
    imageUrl: 'https://api.bingr.one/static/categories/1535267-a-3cae422b372e.webp',
    color: '#6D28D9',
  },
  {
    id: 28,
    name: 'Action',
    imageUrl: 'https://api.bingr.one/static/categories/1535302-a-e90748391e0d.webp',
    color: '#B91C1C',
  },
  {
    id: 53,
    name: 'Thriller',
    imageUrl: 'https://api.bingr.one/static/categories/1535246-a-27373cc1a222.webp',
    color: '#334155',
  },
  {
    id: 80,
    name: 'Crime',
    imageUrl: 'https://api.bingr.one/static/categories/1535288-a-690bac400aa1.webp',
    color: '#475569',
  },
  {
    id: 27,
    name: 'Horror',
    imageUrl: 'https://api.bingr.one/static/categories/1535279-a-c92b487cb711.webp',
    color: '#581C87',
  },
  {
    id: 9648,
    name: 'Mystery',
    imageUrl: 'https://api.bingr.one/static/categories/1535269-a-e0ed0b72ebe7.webp',
    color: '#1E293B',
  },
  {
    id: 878,
    name: 'Sci-Fi',
    imageUrl: 'https://api.bingr.one/static/categories/1535259-a-6e0b7daffb29.webp',
    color: '#0369A1',
  },
  {
    id: 14,
    name: 'Fantasy',
    imageUrl: 'https://api.bingr.one/static/categories/1535282-a-ae97739962dc.webp',
    color: '#0F766E',
  },
  {
    id: 12,
    name: 'Adventure',
    imageUrl: 'https://api.bingr.one/static/categories/1535301-a-9bb68bcd147c.webp',
    color: '#854D0E',
  },
  {
    id: 28,
    name: 'Superhero',
    imageUrl: 'https://api.bingr.one/static/categories/1538364-a-a3b574f36633.webp',
    color: '#4338CA',
  },
  {
    id: 16,
    name: 'Anime',
    imageUrl: 'https://api.bingr.one/static/categories/1750239042025-a.webp',
    color: '#7E22CE',
  },
  {
    id: 16,
    name: 'Animation',
    imageUrl: 'https://api.bingr.one/static/categories/1535299-a-e6296badeb14.webp',
    color: '#BE123C',
  },
  {
    id: 36,
    name: 'Biopic',
    imageUrl: 'https://api.bingr.one/static/categories/1750239188589-a.webp',
    color: '#155E75',
  },
  {
    id: 36,
    name: 'Historical',
    imageUrl: 'https://api.bingr.one/static/categories/1535280-a-a1d64ccd7457.webp',
    color: '#713F12',
  },
  {
    id: 99,
    name: 'Documentary',
    imageUrl: 'https://api.bingr.one/static/categories/1535286-a-f282f00643b5.webp',
    color: '#164E63',
  },
  {
    id: 10402,
    name: 'Musical',
    imageUrl: 'https://api.bingr.one/static/categories/1535270-a-6a85b09721ab.webp',
    color: '#881337',
  },
  {
    id: 36,
    name: 'Devotional & Spiritual',
    imageUrl: 'https://api.bingr.one/static/categories/1608815-a-7d866bb51198.webp',
    color: '#312E81',
  },
  {
    id: 18,
    name: 'Teen',
    imageUrl: 'https://api.bingr.one/static/categories/1535248-a-35ccd1ea9ec0.webp',
    color: '#0369A1',
  },
  {
    id: 99,
    name: 'Lifestyle',
    imageUrl: 'https://api.bingr.one/static/categories/1535274-a-5532b8285ed1.webp',
    color: '#831843',
  },
  {
    id: 99,
    name: 'Travel',
    imageUrl: 'https://api.bingr.one/static/categories/1535245-a-90839834c474.webp',
    color: '#1E3A8A',
  },
  {
    id: 878,
    name: 'Science & Technology',
    imageUrl: 'https://api.bingr.one/static/categories/1568791-a-e50a43088a1a.webp',
    color: '#1E293B',
  },
];

interface GenreRailProps {
  onSelectGenre: (genre: GenreItem) => void;
  onViewAll?: () => void;
}

interface GenreCardItemProps {
  genre: GenreItem;
  isTV: boolean;
  onSelect: (genre: GenreItem) => void;
}

const GenreCardItem = memo(function GenreCardItem({
  genre,
  isTV,
  onSelect,
}: GenreCardItemProps) {
  const [imgError, setImgError] = useState(false);

  const handlePress = useCallback(() => {
    onSelect(genre);
  }, [genre, onSelect]);

  return (
    <TVFocusable
      style={[styles.card, isTV && styles.cardTV]}
      focusedStyle={styles.cardFocused}
      onPress={handlePress}>
      <View style={[styles.cardInner, { backgroundColor: genre.color }]}>
        {!imgError && genre.imageUrl ? (
          <Image
            source={{ uri: genre.imageUrl }}
            style={styles.cardImage}
            resizeMode="cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <View style={styles.fallbackContainer}>
            <Text style={styles.fallbackText}>{genre.name}</Text>
          </View>
        )}
      </View>
    </TVFocusable>
  );
});

export const GenreRail = memo(function GenreRail({
  onSelectGenre,
  onViewAll,
}: GenreRailProps) {
  const { isTV } = useDeviceMode();

  const renderItem = useCallback(
    ({ item }: { item: GenreItem }) => (
      <GenreCardItem
        genre={item}
        isTV={isTV}
        onSelect={onSelectGenre}
      />
    ),
    [isTV, onSelectGenre]
  );

  const keyExtractor = useCallback(
    (item: GenreItem) => `genre-${item.name}-${item.id}`,
    []
  );

  const cardWidth = isTV ? 216 + 16 : 172 + 12;
  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: cardWidth,
      offset: cardWidth * index,
      index,
    }),
    [cardWidth]
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Popular Genres</Text>
        {onViewAll && (
          <TVFocusable
            style={styles.viewAllBtn}
            focusedStyle={styles.viewAllBtnFocused}
            onPress={onViewAll}>
            <Text style={styles.viewAllText}>View All &gt;</Text>
          </TVFocusable>
        )}
      </View>

      <FlatList
        horizontal
        data={POPULAR_GENRES}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, isTV && styles.scrollTV]}
        initialNumToRender={5}
        maxToRenderPerBatch={4}
        windowSize={3}
        removeClippedSubviews={Platform.OS === 'android'}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginTop: 22,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  viewAllBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  viewAllBtnFocused: {
    backgroundColor: '#FFFFFF',
    transform: [{ scale: 1.08 }],
  },
  viewAllText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  scroll: {
    paddingHorizontal: 16,
  },
  scrollTV: {
    paddingHorizontal: 28,
  },
  card: {
    width: 172,
    height: 96,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    backgroundColor: '#07080D',
    marginRight: 12,
  },
  cardTV: {
    width: 216,
    height: 116,
    borderRadius: 14,
    marginRight: 16,
  },
  cardInner: {
    flex: 1,
    position: 'relative',
    justifyContent: 'flex-end',
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
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  fallbackText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  cardFocused: {
    borderColor: '#FFFFFF',
    borderWidth: 2.5,
    transform: [{ scale: 1.06 }],
    elevation: 12,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
});
