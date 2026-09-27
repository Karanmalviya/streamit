import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonBox } from './SkeletonBox';
import { useDeviceMode } from '../../hooks/useDeviceMode';

const GRID_GAP = 6;
const GRID_PADDING = 10 * 2;

interface GridSkeletonProps {
  count?: number;
}

export function GridSkeleton({ count }: GridSkeletonProps) {
  const { width: screenWidth, gridColumns, isTV } = useDeviceMode();
  const cardWidth = Math.floor(
    (screenWidth - GRID_PADDING - GRID_GAP * (gridColumns - 1)) / gridColumns
  );
  const cardHeight = Math.floor(cardWidth * 1.5);
  const totalCount = count ?? (isTV ? 18 : 12);
  const items = Array.from({ length: totalCount }, (_, i) => i);

  return (
    <View style={styles.gridContainer}>
      {items.map(index => (
        <View key={index} style={{ width: cardWidth, height: cardHeight }}>
          <SkeletonBox
            width={cardWidth}
            height={cardHeight}
            borderRadius={6}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
    gap: GRID_GAP,
    paddingTop: 10,
    paddingBottom: 24,
  },
});
