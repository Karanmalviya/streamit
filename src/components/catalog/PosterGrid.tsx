import React, { useCallback, useRef, useEffect, memo } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Platform,
} from 'react-native';
import { MediaItem } from '../../services/tmdb';
import { GridSkeleton } from '../skeletons/GridSkeleton';
import { TVFocusable } from '../common/TVFocusable';
import { useDeviceMode } from '../../hooks/useDeviceMode';
import { tvNavigation } from '../../services/tvNavigation';

const GRID_GAP = 6;
const GRID_PADDING = 10 * 2;

interface PosterGridProps {
  items: MediaItem[];
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  onRefresh?: () => void;
  onLoadMore?: () => void;
  onSelectMedia: (item: MediaItem) => void;
  emptyText?: string;
  onScroll?: (e: any) => void;
  disableSidebarFocus?: boolean;
  onPressUpFirstRow?: () => void;
  contentPaddingBottom?: number;
}

interface GridPosterCardProps {
  item: MediaItem;
  index: number;
  cardWidth: number;
  cardHeight: number;
  gridColumns: number;
  disableSidebarFocus: boolean;
  onPressUpFirstRow?: () => void;
  onFocus: (index: number) => void;
  onSelectMedia: (item: MediaItem) => void;
}

const GridPosterCard = memo(function GridPosterCardComponent({
  item,
  index,
  cardWidth,
  cardHeight,
  gridColumns,
  disableSidebarFocus,
  onPressUpFirstRow,
  onFocus,
  onSelectMedia,
}: GridPosterCardProps) {
  const handlePress = useCallback(() => {
    onSelectMedia(item);
  }, [item, onSelectMedia]);

  const handleFocus = useCallback(() => {
    onFocus(index);
  }, [index, onFocus]);

  return (
    <TVFocusable
      style={[styles.card, { width: cardWidth, height: cardHeight }]}
      focusedStyle={styles.cardFocused}
      borderRadius={5}
      onPressUp={index < gridColumns && onPressUpFirstRow ? onPressUpFirstRow : undefined}
      onPressLeft={
        !disableSidebarFocus && index % gridColumns === 0 && !tvNavigation.getIsModalOpen()
          ? () => tvNavigation.focusSidebar()
          : undefined
      }
      onFocus={handleFocus}
      onPress={handlePress}>
      {item.poster ? (
        <Image source={{ uri: item.poster }} style={styles.posterImg} resizeMode="cover" />
      ) : (
        <View style={styles.fallbackPoster}>
          <Text style={styles.fallbackText}>{item.title}</Text>
        </View>
      )}
    </TVFocusable>
  );
});

export function PosterGrid({
  items,
  loading,
  refreshing,
  loadingMore,
  onRefresh = () => {},
  onLoadMore = () => {},
  onSelectMedia,
  emptyText = 'No titles found',
  onScroll,
  disableSidebarFocus = false,
  onPressUpFirstRow,
  contentPaddingBottom,
}: PosterGridProps) {
  const { isTV, width: screenWidth, gridColumns } = useDeviceMode();
  const flatListRef = useRef<FlatList>(null);
  const isEndReachedPendingRef = useRef(false);
  const prevItemsLengthRef = useRef(items.length);

  // Keep live references so callbacks don't thrash on every scroll/render
  const itemsLengthRef = useRef(items.length);
  itemsLengthRef.current = items.length;
  const loadingRef = useRef(loading);
  loadingRef.current = loading;
  const loadingMoreRef = useRef(loadingMore);
  loadingMoreRef.current = loadingMore;
  const refreshingRef = useRef(refreshing);
  refreshingRef.current = refreshing;
  const onLoadMoreRef = useRef(onLoadMore);
  onLoadMoreRef.current = onLoadMore;

  // Whenever new items arrive or loading completes, allow the next page to trigger
  useEffect(() => {
    if (items.length !== prevItemsLengthRef.current || !loadingMore) {
      prevItemsLengthRef.current = items.length;
      isEndReachedPendingRef.current = false;
    }
  }, [items.length, loadingMore]);

  const cardWidth = Math.floor(
    (screenWidth - GRID_PADDING - GRID_GAP * (gridColumns - 1)) / gridColumns
  );
  const cardHeight = Math.floor(cardWidth * 1.5);
  const rowHeight = cardHeight + GRID_GAP;

  const handleCardFocus = useCallback((index: number) => {
    tvNavigation.setFocusedContent('grid', index % gridColumns);
    if (isTV) {
      try {
        flatListRef.current?.scrollToIndex({
          index,
          viewPosition: 0.3,
          animated: true,
        });
      } catch {
        // ignore out of range
      }

      // Proactive pagination for Android TV / Google TV D-Pad navigation:
      const lookaheadCount = Math.max(gridColumns * 2, 8);
      if (index >= itemsLengthRef.current - lookaheadCount) {
        if (!loadingRef.current && !loadingMoreRef.current && !refreshingRef.current && !isEndReachedPendingRef.current && itemsLengthRef.current >= 10) {
          isEndReachedPendingRef.current = true;
          onLoadMoreRef.current();
        }
      }
    }
  }, [gridColumns, isTV]);

  const renderItem = useCallback(
    ({ item, index }: { item: MediaItem; index: number }) => (
      <GridPosterCard
        item={item}
        index={index}
        cardWidth={cardWidth}
        cardHeight={cardHeight}
        gridColumns={gridColumns}
        disableSidebarFocus={disableSidebarFocus}
        onPressUpFirstRow={onPressUpFirstRow}
        onFocus={handleCardFocus}
        onSelectMedia={onSelectMedia}
      />
    ),
    [cardWidth, cardHeight, gridColumns, disableSidebarFocus, onPressUpFirstRow, handleCardFocus, onSelectMedia]
  );

  const getItemLayout = useCallback(
    (_: any, index: number) => {
      const rowIndex = Math.floor(index / gridColumns);
      return {
        length: rowHeight,
        offset: rowHeight * rowIndex,
        index,
      };
    },
    [rowHeight, gridColumns]
  );

  const keyExtractor = useCallback(
    (item: MediaItem, index: number) => `grid-${item.id}-${item.type}-${index}`,
    []
  );

  const handleEndReached = useCallback(() => {
    if (isEndReachedPendingRef.current) return;
    if (!loadingRef.current && !loadingMoreRef.current && !refreshingRef.current && itemsLengthRef.current >= 10) {
      isEndReachedPendingRef.current = true;
      onLoadMoreRef.current();
    }
  }, []);

  if (loading && !refreshing && items.length === 0) {
    return <GridSkeleton />;
  }

  return (
    <FlatList
      ref={flatListRef}
      key={`grid-cols-${gridColumns}`}
      data={items}
      keyExtractor={keyExtractor}
      numColumns={gridColumns}
      contentContainerStyle={[
        styles.content,
        contentPaddingBottom !== undefined && { paddingBottom: contentPaddingBottom },
      ]}
      columnWrapperStyle={styles.row}
      initialNumToRender={isTV ? 18 : 12}
      maxToRenderPerBatch={isTV ? 12 : 8}
      windowSize={5}
      updateCellsBatchingPeriod={50}
      removeClippedSubviews={Platform.OS === 'android'}
      getItemLayout={getItemLayout}
      onScroll={onScroll}
      scrollEventThrottle={32}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" />
      }
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.7}
      renderItem={renderItem}
      ListEmptyComponent={
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>{emptyText}</Text>
        </View>
      }
      ListFooterComponent={
        loadingMore ? (
          <View style={styles.footerLoader}>
            <GridSkeleton count={gridColumns} />
          </View>
        ) : undefined
      }
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 10,
    paddingTop: 12,
    paddingBottom: 95,
  },
  row: {
    gap: GRID_GAP,
    marginBottom: GRID_GAP,
  },
  card: {
    borderRadius: 5,
    overflow: 'hidden',
    backgroundColor: '#07080B',
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 250,
  },
  emptyText: {
    color: '#555C70',
    fontSize: 13,
  },
  footerLoader: {
    paddingVertical: 18,
    alignItems: 'center',
  },
});
