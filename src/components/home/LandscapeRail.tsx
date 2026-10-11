import React, { memo, useCallback, useRef } from 'react';
import { View, Text, FlatList, Image, StyleSheet, Pressable } from 'react-native';
import { MediaItem } from '../../services/tmdb';
import { TVFocusable } from '../common/TVFocusable';
import { TVFixedFocusShelf } from '../common/TVFixedFocusShelf';
import { useDeviceMode } from '../../hooks/useDeviceMode';
import { CardBottomFade } from '../common/FadedOverlay';
import { tvNavigation } from '../../services/tvNavigation';

const WIDE_CARD_WIDTH = 220;
const WIDE_CARD_HEIGHT = 124;
const WIDE_CARD_GAP = 8;
const ITEM_TOTAL_WIDTH = WIDE_CARD_WIDTH + WIDE_CARD_GAP;

interface LandscapeRailProps {
  title: string;
  items: MediaItem[];
  subTitle?: string;
  railId?: string;
  onSelectMedia: (item: MediaItem) => void;
  onViewAll?: () => void;
  onFocus?: () => void;
}

interface LandscapeInnerProps {
  item: MediaItem;
}

const LandscapeInner = memo(function LandscapeInnerComponent({ item }: LandscapeInnerProps) {
  return (
    <View style={styles.card}>
      <Image
        source={{ uri: item.backdrop || item.poster || undefined }}
        style={styles.cardImage}
        resizeMode="cover"
      />
      <CardBottomFade />
      <View style={styles.cardOverlay}>
        <View style={styles.ratingPill}>
          <Text style={styles.ratingText}>★ {item.rating.toFixed(1)}</Text>
        </View>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.title}
        </Text>
      </View>
    </View>
  );
});

interface LandscapeCardProps {
  item: MediaItem;
  index: number;
  onSelect: (item: MediaItem) => void;
  onCardFocus?: (index: number) => void;
}

const LandscapeCard = memo(function LandscapeCardComponent({ item, onSelect }: LandscapeCardProps) {
  const handlePress = useCallback(() => {
    onSelect(item);
  }, [item, onSelect]);

  return (
    <Pressable onPress={handlePress}>
      <LandscapeInner item={item} />
    </Pressable>
  );
});

export const LandscapeRail = memo(function LandscapeRailComponent({
  title,
  items,
  subTitle = 'Prime Picks',
  railId = 'landscape_rail',
  onSelectMedia,
  onViewAll,
  onFocus,
}: LandscapeRailProps) {
  const { isTV } = useDeviceMode();
  const flatListRef = useRef<FlatList>(null);

  const handleCardFocus = useCallback((index: number) => {
    if (onFocus) onFocus();
    try {
      flatListRef.current?.scrollToIndex({
        index,
        viewPosition: 0.2,
        animated: true,
      });
    } catch {
      // ignore
    }
  }, [onFocus]);

  const renderItem = useCallback(
    ({ item, index }: { item: MediaItem; index: number }) => (
      <LandscapeCard
        item={item}
        index={index}
        onSelect={onSelectMedia}
        onCardFocus={handleCardFocus}
      />
    ),
    [onSelectMedia, handleCardFocus]
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
            borderRadius={6}
            disabled={isTV}
            onFocus={onFocus}
            onPress={onViewAll}>
            <Text style={styles.viewAllText}>View All &gt;</Text>
          </TVFocusable>
        )}
      </View>

      {isTV ? (
        <TVFixedFocusShelf
          data={items}
          itemWidth={ITEM_TOTAL_WIDTH}
          cardWidth={WIDE_CARD_WIDTH}
          cardHeight={WIDE_CARD_HEIGHT}
          borderRadius={8}
          anchorLeft={12}
          anchorTop={12}
          paddingLeft={12}
          paddingTop={12}
          paddingBottom={16}
          railId={railId}
          onSelect={onSelectMedia}
          onFocus={onFocus}
          onPressLeftAtStart={() => tvNavigation.focusSidebar('home')}
          renderItem={(item, index) => (
            <LandscapeInner key={`tv-wide-${item.id}-${index}`} item={item} />
          )}
        />
      ) : (
        <FlatList
          ref={flatListRef}
          horizontal
          data={items}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          getItemLayout={getItemLayout}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          initialNumToRender={5}
          maxToRenderPerBatch={5}
          windowSize={5}
          removeClippedSubviews={true}
        />
      )}
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
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  viewAllBtnFocused: {
    backgroundColor: '#FFFFFF',
    },
  viewAllText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  scroll: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  card: {
    width: WIDE_CARD_WIDTH,
    height: WIDE_CARD_HEIGHT,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#07080B',
    position: 'relative',
    marginRight: WIDE_CARD_GAP,
  },
  cardFocused: {
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
  },
  ratingPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
    marginBottom: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
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
    textShadowColor: 'rgba(0, 0, 0, 0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
