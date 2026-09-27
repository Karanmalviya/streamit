import React, { memo, useCallback } from 'react';
import { View, Text, FlatList, Image, StyleSheet, Platform } from 'react-native';
import { MediaItem } from '../../services/tmdb';
import { TVFocusable } from '../common/TVFocusable';

const WIDE_CARD_WIDTH = 220;
const WIDE_CARD_HEIGHT = 124;
const WIDE_CARD_GAP = 8;
const ITEM_TOTAL_WIDTH = WIDE_CARD_WIDTH + WIDE_CARD_GAP;

interface LandscapeRailProps {
  title: string;
  items: MediaItem[];
  subTitle?: string;
  onSelectMedia: (item: MediaItem) => void;
  onViewAll?: () => void;
}

interface LandscapeCardProps {
  item: MediaItem;
  onSelect: (item: MediaItem) => void;
}

const LandscapeCard = memo(function LandscapeCardComponent({ item, onSelect }: LandscapeCardProps) {
  const handlePress = useCallback(() => {
    onSelect(item);
  }, [item, onSelect]);

  return (
    <TVFocusable
      style={styles.card}
      focusedStyle={styles.cardFocused}
      onPress={handlePress}>
      <Image
        source={{ uri: item.backdrop || item.poster || undefined }}
        style={styles.cardImage}
        resizeMode="cover"
      />
      <View style={styles.cardOverlay}>
        <View style={styles.ratingPill}>
          <Text style={styles.ratingText}>★ {item.rating.toFixed(1)}</Text>
        </View>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.title}
        </Text>
      </View>
    </TVFocusable>
  );
});

export const LandscapeRail = memo(function LandscapeRailComponent({
  title,
  items,
  subTitle = 'Prime Picks',
  onSelectMedia,
  onViewAll,
}: LandscapeRailProps) {
  const renderItem = useCallback(
    ({ item }: { item: MediaItem }) => (
      <LandscapeCard item={item} onSelect={onSelectMedia} />
    ),
    [onSelectMedia]
  );

  const keyExtractor = useCallback(
    (item: MediaItem) => `wide-${item.id}`,
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
  card: {
    width: WIDE_CARD_WIDTH,
    height: WIDE_CARD_HEIGHT,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#131520',
    position: 'relative',
    marginRight: WIDE_CARD_GAP,
  },
  cardFocused: {
    borderColor: '#FFFFFF',
    borderWidth: 2.5,
    transform: [{ scale: 1.08 }],
    zIndex: 10,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 8,
    paddingBottom: 6,
    backgroundColor: 'rgba(8, 9, 13, 0.75)',
  },
  ratingPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#1F2434',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
    marginBottom: 2,
  },
  ratingText: {
    color: '#F4C042',
    fontSize: 9,
    fontWeight: '800',
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
