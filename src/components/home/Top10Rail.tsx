import React, { memo, useCallback } from 'react';
import { View, Text, FlatList, Image, StyleSheet, Platform } from 'react-native';
import { MediaItem } from '../../services/tmdb';
import { TVFocusable } from '../common/TVFocusable';

const TOP10_CARD_WIDTH = 135;
const TOP10_CARD_HEIGHT = 185;
const TOP10_CARD_GAP = 2;
const ITEM_TOTAL_WIDTH = TOP10_CARD_WIDTH + TOP10_CARD_GAP;

interface Top10RailProps {
  title?: string;
  subTitle?: string;
  items: MediaItem[];
  onSelectMedia: (item: MediaItem) => void;
  onViewAll?: () => void;
}

interface Top10CardProps {
  item: MediaItem;
  rank: number;
  onSelect: (item: MediaItem) => void;
}

const Top10Card = memo(function Top10CardComponent({ item, rank, onSelect }: Top10CardProps) {
  const handlePress = useCallback(() => {
    onSelect(item);
  }, [item, onSelect]);

  return (
    <TVFocusable
      style={styles.cardWrapper}
      focusedStyle={styles.cardFocused}
      onPress={handlePress}>
      {/* Stylized Rank Number */}
      <Text style={styles.bigNumber}>{rank}</Text>

      {/* Poster Artwork */}
      <View style={styles.posterContainer}>
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
      </View>
    </TVFocusable>
  );
});

export const Top10Rail = memo(function Top10RailComponent({
  title = 'Top 10 This Week',
  subTitle = 'Trending',
  items,
  onSelectMedia,
  onViewAll,
}: Top10RailProps) {
  const renderItem = useCallback(
    ({ item, index }: { item: MediaItem; index: number }) => (
      <Top10Card item={item} rank={index + 1} onSelect={onSelectMedia} />
    ),
    [onSelectMedia]
  );

  const keyExtractor = useCallback(
    (item: MediaItem) => `top10-${item.id}`,
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
          {subTitle && <Text style={styles.subTitle}>{subTitle}</Text>}
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
        initialNumToRender={4}
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
    alignItems: 'baseline',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  subTitle: {
    fontSize: 11,
    color: '#70778C',
    fontWeight: '600',
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
  scroll: {
    paddingHorizontal: 12,
  },
  cardWrapper: {
    width: TOP10_CARD_WIDTH,
    height: TOP10_CARD_HEIGHT,
    flexDirection: 'row',
    alignItems: 'flex-end',
    position: 'relative',
    borderRadius: 8,
    marginRight: TOP10_CARD_GAP,
  },
  cardFocused: {
    borderColor: '#FFFFFF',
    borderWidth: 2,
    transform: [{ scale: 1.08 }],
    zIndex: 10,
  },
  bigNumber: {
    fontSize: 94,
    fontWeight: '900',
    color: '#1E2333',
    lineHeight: 96,
    position: 'absolute',
    left: -4,
    bottom: -10,
    zIndex: 1,
  },
  posterContainer: {
    width: 95,
    height: 155,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#161824',
    marginLeft: 38,
    zIndex: 2,
    elevation: 4,
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
