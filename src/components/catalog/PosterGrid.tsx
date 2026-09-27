import React from 'react';
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
}: PosterGridProps) {
  const { width: screenWidth, gridColumns } = useDeviceMode();
  const cardWidth = Math.floor(
    (screenWidth - GRID_PADDING - GRID_GAP * (gridColumns - 1)) / gridColumns
  );
  const cardHeight = Math.floor(cardWidth * 1.5);

  if (loading && !refreshing && items.length === 0) {
    return <GridSkeleton />;
  }

  return (
    <FlatList
      key={`grid-cols-${gridColumns}`}
      data={items}
      keyExtractor={item => `grid-${item.id}-${item.type}`}
      numColumns={gridColumns}
      contentContainerStyle={styles.content}
      columnWrapperStyle={styles.row}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" />
      }
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.5}
      renderItem={({ item }) => (
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
      )}
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
    backgroundColor: '#12141C',
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
    backgroundColor: '#141622',
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
