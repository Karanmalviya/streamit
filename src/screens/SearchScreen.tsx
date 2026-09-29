import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
} from 'react-native';
import { MediaItem } from '../services/tmdb';
import { SearchIcon } from '../components/common/Icons';
import { PosterGrid } from '../components/catalog/PosterGrid';
import { GridSkeleton } from '../components/skeletons/GridSkeleton';
import { TVFocusable } from '../components/common/TVFocusable';

export type SearchFilterType = 'all' | 'movie' | 'tv' | 'anime';

interface SearchScreenProps {
  searchQuery: string;
  searchType: SearchFilterType;
  searchResults: MediaItem[];
  suggestions: MediaItem[];
  loading: boolean;
  topInset: number;
  onSearchChange: (text: string, type: SearchFilterType) => void;
  onTypeChange: (type: SearchFilterType) => void;
  onSelectMedia: (item: MediaItem) => void;
  onScroll?: (e: any) => void;
}

export function SearchScreen({
  searchQuery,
  searchType,
  searchResults,
  suggestions,
  loading,
  topInset,
  onSearchChange,
  onTypeChange,
  onSelectMedia,
  onScroll,
}: SearchScreenProps) {
  const types: { id: SearchFilterType; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'movie', label: 'Movies' },
    { id: 'tv', label: 'Series' },
    { id: 'anime', label: 'Anime' },
  ];

  return (
    <View style={[styles.container, { paddingTop: topInset + 56 }]}>
      {/* Search Input Box */}
      <View style={styles.searchBarBox}>
        <SearchIcon color="#70768A" size={17} />
        <TextInput
          placeholder="Search movies, TV shows, anime..."
          placeholderTextColor="#5E6578"
          value={searchQuery}
          onChangeText={text => onSearchChange(text, searchType)}
          style={styles.searchTextInput}
          returnKeyType="search"
          autoFocus={false}
        />
        {searchQuery.length > 0 && (
          <TVFocusable
            style={styles.clearSearchBtnWrap}
            focusedStyle={styles.clearBtnFocused}
            onPress={() => onSearchChange('', searchType)}>
            <Text style={styles.clearSearchBtn}>✕</Text>
          </TVFocusable>
        )}
      </View>

      {/* Filter Type Chips */}
      <View style={styles.typeRow}>
        {types.map(t => {
          const isSelected = searchType === t.id;
          return (
            <TVFocusable
              key={t.id}
              style={[styles.typeChip, isSelected && styles.typeChipActive]}
              focusedStyle={styles.typeChipFocused}
              onPress={() => onTypeChange(t.id)}>
              <Text style={[styles.typeChipText, isSelected && styles.typeChipTextActive]}>
                {t.label}
              </Text>
            </TVFocusable>
          );
        })}
      </View>

      {/* Content Feed (Results or Popular Suggestions) */}
      {loading ? (
        <GridSkeleton count={9} />
      ) : searchQuery.trim().length > 0 ? (
        <PosterGrid
          items={searchResults}
          loading={false}
          refreshing={false}
          loadingMore={false}
          onRefresh={() => {}}
          onLoadMore={() => {}}
          onSelectMedia={onSelectMedia}
          onScroll={onScroll}
          emptyText={`No results found for "${searchQuery}"`}
        />
      ) : (
        <View style={styles.suggestionsWrapper}>
          <View style={styles.promptHeader}>
            <Text style={styles.promptTitle}>Popular Searches</Text>
          </View>
          <PosterGrid
            items={suggestions}
            loading={false}
            refreshing={false}
            loadingMore={false}
            onRefresh={() => {}}
            onLoadMore={() => {}}
            onSelectMedia={onSelectMedia}
            onScroll={onScroll}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBarBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 14,
    marginTop: 8,
    marginBottom: 10,
    paddingHorizontal: 12,
    backgroundColor: '#0A0C11',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#171B24',
    height: 42,
  },
  searchTextInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    marginLeft: 8,
    paddingVertical: 0,
  },
  clearSearchBtnWrap: {
    borderRadius: 12,
  },
  clearBtnFocused: {
    borderColor: '#FFFFFF',
    borderWidth: 1.5,
  },
  clearSearchBtn: {
    color: '#656D84',
    fontSize: 14,
    padding: 4,
  },
  typeRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingBottom: 10,
    gap: 8,
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#0A0C11',
    borderWidth: 1,
    borderColor: '#151922',
  },
  typeChipActive: {
    backgroundColor: '#1C212E',
    borderColor: '#2D354A',
  },
  typeChipFocused: {
    borderColor: '#FFFFFF',
    borderWidth: 1.5,
    backgroundColor: '#242A3B',
  },
  typeChipText: {
    color: '#656D84',
    fontSize: 11,
    fontWeight: '600',
  },
  typeChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  suggestionsWrapper: {
    flex: 1,
  },
  promptHeader: {
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 8,
  },
  promptTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
