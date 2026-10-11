import React, { memo, useCallback, useRef } from 'react';
import { View, Text, FlatList, Image, StyleSheet, Pressable } from 'react-native';
import { MediaItem } from '../../services/tmdb';
import { TVFocusable } from '../common/TVFocusable';
import { TVFixedFocusShelf } from '../common/TVFixedFocusShelf';
import { useDeviceMode } from '../../hooks/useDeviceMode';
import { tvNavigation } from '../../services/tvNavigation';

const POSTER_WIDTH = 118;
const POSTER_HEIGHT = 174;
const POSTER_GAP = 8;
const ITEM_TOTAL_WIDTH = POSTER_WIDTH + POSTER_GAP;

interface PosterRailProps {
  title: string;
  items: MediaItem[];
  badgeText?: string;
  railId?: string;
  onSelectMedia: (item: MediaItem) => void;
  onViewAll?: () => void;
  onFocus?: () => void;
}

interface PosterInnerProps {
  item: MediaItem;
}

const PosterInner = memo(function PosterInnerComponent({ item }: PosterInnerProps) {
  return (
    <View style={styles.card}>
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
  );
});

interface PosterCardProps {
  item: MediaItem;
  index: number;
  onSelect: (item: MediaItem) => void;
  onCardFocus?: (index: number) => void;
}

const PosterCard = memo(function PosterCardComponent({ item, onSelect }: PosterCardProps) {
  const handlePress = useCallback(() => {
    onSelect(item);
  }, [item, onSelect]);

  return (
    <Pressable onPress={handlePress}>
      <PosterInner item={item} />
    </Pressable>
  );
});

export const PosterRail = memo(function PosterRailComponent({
  title,
  items,
  badgeText,
  railId = 'poster_rail',
  onSelectMedia,
  onViewAll,
  onFocus,
}: PosterRailProps) {
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
      // ignore out of bounds scroll attempts
    }
  }, [onFocus]);

  const renderItem = useCallback(
    ({ item, index }: { item: MediaItem; index: number }) => (
      <PosterCard
        item={item}
        index={index}
        onSelect={onSelectMedia}
        onCardFocus={handleCardFocus}
      />
    ),
    [onSelectMedia, handleCardFocus]
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
          cardWidth={POSTER_WIDTH}
          cardHeight={POSTER_HEIGHT}
          borderRadius={6}
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
            <PosterInner key={`tv-poster-${item.id}-${index}`} item={item} />
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
          initialNumToRender={6}
          maxToRenderPerBatch={6}
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
  badge: {
    backgroundColor: 'rgba(229, 9, 20, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderColor: 'rgba(229, 9, 20, 0.3)',
  },
  badgeText: {
    color: '#E50914',
    fontSize: 9,
    fontWeight: '800',
  },
  scroll: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  card: {
    width: POSTER_WIDTH,
    height: POSTER_HEIGHT,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#07080B',
    marginRight: POSTER_GAP,
  },
  cardFocused: {
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
    backgroundColor: '#0A0B0E',
    padding: 8,
  },
  fallbackText: {
    color: '#656D84',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
});
