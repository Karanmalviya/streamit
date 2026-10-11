import React, { memo, useCallback, useRef } from 'react';
import { View, Text, FlatList, Image, StyleSheet, Pressable } from 'react-native';
import { TVFocusable } from '../common/TVFocusable';
import { TVFixedFocusShelf } from '../common/TVFixedFocusShelf';
import { useDeviceMode } from '../../hooks/useDeviceMode';
import { CardBottomFade } from '../common/FadedOverlay';
import { tvNavigation } from '../../services/tvNavigation';
import { WatchHistoryItem } from '../../services/history';

const WIDE_CARD_WIDTH = 220;
const WIDE_CARD_HEIGHT = 124;
const WIDE_CARD_GAP = 8;
const ITEM_TOTAL_WIDTH = WIDE_CARD_WIDTH + WIDE_CARD_GAP;

interface HistoryRailProps {
  title?: string;
  items: WatchHistoryItem[];
  subTitle?: string;
  onSelectMedia: (item: any) => void; // passed MediaItem for compatibility
  onViewAll?: () => void;
  onFocus?: () => void;
}

interface HistoryInnerProps {
  item: WatchHistoryItem;
}

const HistoryInner = memo(function HistoryInnerComponent({ item }: HistoryInnerProps) {
  const progressPercent = item.duration > 0 ? (item.progress / item.duration) * 100 : 0;
  const timeLeftMins = item.duration > 0 ? Math.max(1, Math.ceil((item.duration - item.progress) / 60)) : 0;
  let timeFormatted = `${timeLeftMins}m left`;
  if (timeLeftMins >= 60) {
    const h = Math.floor(timeLeftMins / 60);
    const m = timeLeftMins % 60;
    timeFormatted = m > 0 ? `${h}h ${m}m left` : `${h}h left`;
  }
  
  const isSeries = item.media.type === 'tv' && item.season && item.episode;
  const subtitleText = isSeries ? `S${item.season} E${item.episode} • ${timeFormatted}` : timeFormatted;

  return (
    <View style={styles.card}>
      <Image
        source={{ uri: item.media.backdrop || item.media.poster || undefined }}
        style={styles.cardImage}
        resizeMode="cover"
      />
      <CardBottomFade />
      <View style={styles.cardOverlay}>
        <View style={styles.timePill}>
          <Text style={styles.timePillText}>{subtitleText}</Text>
        </View>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.media.title}
        </Text>
      </View>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${Math.min(100, Math.max(4, progressPercent))}%` }]} />
      </View>
    </View>
  );
});

interface HistoryCardProps {
  item: WatchHistoryItem;
  index: number;
  onSelect: (item: any) => void;
  onCardFocus?: (index: number) => void;
}

const HistoryCard = memo(function HistoryCardComponent({ item, onSelect }: HistoryCardProps) {
  const handlePress = useCallback(() => {
    onSelect(item.media);
  }, [item, onSelect]);

  return (
    <Pressable onPress={handlePress}>
      <HistoryInner item={item} />
    </Pressable>
  );
});

export const HistoryRail = memo(function HistoryRailComponent({
  title = 'Continue Watching',
  items,
  subTitle,
  onSelectMedia,
  onViewAll,
  onFocus,
}: HistoryRailProps) {
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
    ({ item, index }: { item: WatchHistoryItem; index: number }) => (
      <HistoryCard
        item={item}
        index={index}
        onSelect={onSelectMedia}
        onCardFocus={handleCardFocus}
      />
    ),
    [onSelectMedia, handleCardFocus]
  );

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: ITEM_TOTAL_WIDTH,
      offset: ITEM_TOTAL_WIDTH * index,
      index,
    }),
    []
  );

  if (!items || items.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <Text style={styles.title}>{title}</Text>
          {subTitle && subTitle !== title ? <Text style={styles.subTitle}>{subTitle}</Text> : null}
        </View>
        {onViewAll && items.length > 5 && (
          <TVFocusable
            style={styles.viewAllBtn}
            focusedStyle={styles.viewAllBtnFocused}
            borderRadius={6}
            disabled={isTV}
            onPress={onViewAll}
            onFocus={onFocus}>
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
          railId="history"
          onSelect={(item) => onSelectMedia(item.media)}
          onFocus={onFocus}
          onPressLeftAtStart={() => tvNavigation.focusSidebar('home')}
          renderItem={(item, index) => (
            <HistoryInner key={`tv-history-${item.media.id}-${index}`} item={item} />
          )}
        />
      ) : (
        <FlatList
          ref={flatListRef}
          data={items}
          horizontal
          keyExtractor={item => item.media.id.toString()}
          renderItem={renderItem}
          getItemLayout={getItemLayout}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          snapToInterval={ITEM_TOTAL_WIDTH}
          decelerationRate="fast"
          initialNumToRender={5}
          maxToRenderPerBatch={5}
          windowSize={3}
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
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  card: {
    width: WIDE_CARD_WIDTH,
    height: WIDE_CARD_HEIGHT,
    borderRadius: 8,
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
    paddingHorizontal: 10,
    paddingBottom: 8,
  },
  timePill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  timePillText: {
    color: '#E5E7EB',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  progressBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3.5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#E50914',
  },
});
