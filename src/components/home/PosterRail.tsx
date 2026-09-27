import React, { memo, useCallback } from 'react';
import { View, Text, FlatList, Image, StyleSheet, Platform } from 'react-native';
import { MediaItem } from '../../services/tmdb';
import { TVFocusable } from '../common/TVFocusable';

const POSTER_WIDTH = 118;
const POSTER_HEIGHT = 174;
const POSTER_GAP = 8;
const ITEM_TOTAL_WIDTH = POSTER_WIDTH + POSTER_GAP;

interface PosterRailProps {
  title: string;
  items: MediaItem[];
  badgeText?: string;
  onSelectMedia: (item: MediaItem) => void;
  onViewAll?: () => void;
}

interface PosterCardProps {
  item: MediaItem;
  onSelect: (item: MediaItem) => void;
}

const PosterCard = memo(function PosterCardComponent({ item, onSelect }: PosterCardProps) {
  const handlePress = useCallback(() => {
    onSelect(item);
  }, [item, onSelect]);

  return (
    <TVFocusable
      style={styles.card}
      focusedStyle={styles.cardFocused}
      onPress={handlePress}>
      {item.poster ? (
        <Image
          source={{ uri: item.poster }}
          style={styles.posterImg}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.fallbackPoster}>
          <Text style={styles.fallbackText}>{item.title}</Text>
        </View>
      )}
    </TVFocusable>
  );
});

export const PosterRail = memo(function PosterRailComponent({
  title,
  items,
  badgeText,
  onSelectMedia,
  onViewAll,
}: PosterRailProps) {
  const renderItem = useCallback(
    ({ item }: { item: MediaItem }) => (
      <PosterCard item={item} onSelect={onSelectMedia} />
    ),
    [onSelectMedia]
  );

  const keyExtractor = useCallback(
    (item: MediaItem) => `poster-${item.id}-${item.type}`,
    []
  );

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: ITEM_TOTAL_WIDTH,
      offset: ITEM_TOTAL_WIDTH * index,
      index,
    }),
    []
  );

  if (!items || !items.length) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <Text style={styles.title}>{title}</Text>
          {badgeText && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badgeText}</Text>
            </View>
          )}
        </View>
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
        data={items}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
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
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  viewAllBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
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
  badge: {
    backgroundColor: 'rgba(229, 9, 20, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(229, 9, 20, 0.3)',
  },
  badgeText: {
    color: '#E50914',
    fontSize: 9,
    fontWeight: '800',
  },
  scroll: {
    paddingHorizontal: 12,
  },
  card: {
    width: POSTER_WIDTH,
    height: POSTER_HEIGHT,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#12141C',
    marginRight: POSTER_GAP,
  },
  cardFocused: {
    borderColor: '#FFFFFF',
    borderWidth: 2.5,
    transform: [{ scale: 1.08 }],
    zIndex: 10,
  },
  posterImg: {
    width: '100%',
    height: '100%',
  },
  fallbackPoster: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#141622',
    padding: 8,
  },
  fallbackText: {
    color: '#656D84',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
});
