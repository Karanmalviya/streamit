import React, { useCallback, memo } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { MediaItem } from '../../services/tmdb';
import { GridSkeleton } from '../skeletons/GridSkeleton';
import { TVFocusable } from '../common/TVFocusable';
import { useDeviceMode } from '../../hooks/useDeviceMode';

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
}

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
}: PosterGridProps) {
  const { width: screenWidth, gridColumns } = useDeviceMode();
  const cardWidth = Math.floor(
    (screenWidth - GRID_PADDING - GRID_GAP * (gridColumns - 1)) / gridColumns
  );
  const cardHeight = Math.floor(cardWidth * 1.5);
  const rowHeight = cardHeight + GRID_GAP;

  const renderItem = useCallback(
    ({ item }: { item: MediaItem }) => (
      <TVFocusable
        style={[styles.card, { width: cardWidth, height: cardHeight }]}
        focusedStyle={styles.cardFocused}
        onPress={() => onSelectMedia(item)}>
        {item.poster ? (
          <Image source={{ uri: item.poster }} style={styles.posterImg} resizeMode="cover" />
        ) : (
          <View style={styles.fallbackPoster}>
            <Text style={styles.fallbackText}>{item.title}</Text>
          </View>
        )}
      </TVFocusable>
    ),
    [cardWidth, cardHeight, onSelectMedia]
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
    [gridColumns, rowHeight]
  );

  const keyExtractor = useCallback(
    (item: MediaItem) => `grid-${item.id}-${item.type}`,
    []
  );

  if (loading && !refreshing && items.length === 0) {
    return <GridSkeleton />;
  }

  return (
    <FlatList
      key={`grid-cols-${gridColumns}`}
      data={items}
      keyExtractor={keyExtractor}
      numColumns={gridColumns}
      contentContainerStyle={styles.content}
      columnWrapperStyle={styles.row}
      getItemLayout={getItemLayout}
      initialNumToRender={10}
      maxToRenderPerBatch={8}
      windowSize={4}
      updateCellsBatchingPeriod={50}
      removeClippedSubviews={true}
      onScroll={onScroll}
      scrollEventThrottle={16}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" />
      }
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.5}
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
    paddingTop: 8,
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
    borderColor: '#FFFFFF',
    borderWidth: 2.5,
    transform: [{ scale: 1.05 }],
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
