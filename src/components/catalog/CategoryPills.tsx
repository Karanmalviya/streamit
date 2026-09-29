import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { CategoryFilter } from '../../services/tmdb';
import { TVFocusable } from '../common/TVFocusable';

export interface SubCategory {
  id: CategoryFilter;
  label: string;
}

interface CategoryPillsProps {
  categories: SubCategory[];
  activeId: CategoryFilter;
  onSelect: (id: CategoryFilter) => void;
}

export function CategoryPills({ categories, activeId, onSelect }: CategoryPillsProps) {
  return (
    <View style={styles.header}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {categories.map(sub => {
          const isSelected = activeId === sub.id;
          return (
            <TVFocusable
              key={sub.id}
              style={[styles.pill, isSelected && styles.pillActive]}
              focusedStyle={styles.pillFocused}
              onPress={() => onSelect(sub.id)}>
              <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>
                {sub.label}
              </Text>
            </TVFocusable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#0E1017',
  },
  scroll: {
    paddingHorizontal: 12,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#0A0C11',
    borderWidth: 1,
    borderColor: '#151922',
  },
  pillActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  pillFocused: {
    borderColor: '#FFFFFF',
    borderWidth: 2,
    backgroundColor: '#1E2333',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#70778C',
    letterSpacing: 0.2,
  },
  pillTextActive: {
    color: '#000000',
    fontWeight: '800',
  },
});
