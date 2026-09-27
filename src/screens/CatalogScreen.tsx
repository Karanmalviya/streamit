import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MediaItem, CategoryFilter } from '../services/tmdb';
import { CategoryPills, SubCategory } from '../components/catalog/CategoryPills';
import { PosterGrid } from '../components/catalog/PosterGrid';

interface CatalogScreenProps {
  categories: SubCategory[];
  activeCategory: CategoryFilter;
  items: MediaItem[];
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  topInset: number;
  onSelectCategory: (id: CategoryFilter) => void;
  onRefresh: () => void;
  onLoadMore: () => void;
  onSelectMedia: (item: MediaItem) => void;
}

export function CatalogScreen({
  categories,
  activeCategory,
  items,
  loading,
  refreshing,
  loadingMore,
  topInset,
  onSelectCategory,
  onRefresh,
  onLoadMore,
  onSelectMedia,
}: CatalogScreenProps) {
  return (
    <View style={[styles.container, { paddingTop: topInset + 46 }]}>
      {/* Subcategories Horizontal Filter Pills */}
      <CategoryPills
        categories={categories}
        activeId={activeCategory}
        onSelect={onSelectCategory}
      />

      {/* Pure 3-Column Poster Grid */}
      <PosterGrid
        items={items}
        loading={loading}
        refreshing={refreshing}
        loadingMore={loadingMore}
        onRefresh={onRefresh}
        onLoadMore={onLoadMore}
        onSelectMedia={onSelectMedia}
        emptyText="No titles found in this category"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
