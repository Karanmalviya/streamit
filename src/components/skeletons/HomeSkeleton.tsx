import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SkeletonBox } from './SkeletonBox';
import { useDeviceMode } from '../../hooks/useDeviceMode';

interface HomeSkeletonProps {
  topInset: number;
}

export function HomeSkeleton({ topInset }: HomeSkeletonProps) {
  const { width: screenWidth, height: screenHeight, isLandscape, isTV } = useDeviceMode();

  const isWide = isTV || isLandscape;
  const navbarHeight = isWide ? 0 : topInset + 56;
  const posterHeight = isWide
    ? Math.round(Math.min(screenHeight * 0.74, 480))
    : Math.round(screenWidth * (9 / 16));
  const billboardTotalHeight = isWide ? posterHeight : posterHeight + navbarHeight;
  const fadeHeight = Math.round(posterHeight * (isWide ? 0.72 : 0.8));
  const imageTop = isWide ? 0 : navbarHeight;

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}>
      {/* 1. Billboard Skeleton */}
      <View style={[styles.billboardContainer, { width: screenWidth, height: billboardTotalHeight }]}>
        <View style={[styles.heroPosterWrap, { top: imageTop, width: screenWidth, height: posterHeight }]}>
          <SkeletonBox
            width={screenWidth}
            height={posterHeight}
            borderRadius={0}
          />
        </View>

        {/* Billboard Bottom Details */}
        <View style={[styles.billboardDetails, { height: fadeHeight }]}>
          <View style={styles.badgeRow}>
            <SkeletonBox width={46} height={16} borderRadius={3} />
            <SkeletonBox width={160} height={12} borderRadius={3} />
          </View>
          <View style={styles.titleSpacing}>
            <SkeletonBox width="70%" height={26} borderRadius={4} />
          </View>
          <View style={styles.genreSpacing}>
            <SkeletonBox width="45%" height={12} borderRadius={3} />
          </View>
        </View>
      </View>

      {/* 2. Top 10 Rail Skeleton */}
      <View style={styles.railSection}>
        <View style={styles.railHeader}>
          <SkeletonBox width={150} height={16} borderRadius={4} />
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.railScroll}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <View key={i} style={styles.top10Card}>
              <SkeletonBox width={125} height={175} borderRadius={6} />
            </View>
          ))}
        </ScrollView>
      </View>

      {/* 3. Horizontal Poster Rail Skeleton */}
      <View style={styles.railSection}>
        <View style={styles.railHeader}>
          <SkeletonBox width={130} height={16} borderRadius={4} />
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.railScroll}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <View key={i} style={styles.posterCard}>
              <SkeletonBox width={110} height={165} borderRadius={6} />
            </View>
          ))}
        </ScrollView>
      </View>

      {/* 4. Landscape Rail Skeleton */}
      <View style={styles.railSection}>
        <View style={styles.railHeader}>
          <SkeletonBox width={180} height={16} borderRadius={4} />
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.railScroll}>
          {[1, 2, 3, 4].map(i => (
            <View key={i} style={styles.landscapeCard}>
              <SkeletonBox width={220} height={124} borderRadius={6} />
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 20,
  },
  billboardContainer: {
    position: 'relative',
    justifyContent: 'flex-end',
  },
  heroPosterWrap: {
    position: 'absolute',
    left: 0,
  },
  billboardDetails: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    justifyContent: 'flex-end',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  titleSpacing: {
    marginBottom: 8,
  },
  genreSpacing: {
    marginBottom: 16,
  },
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flexPlayBtn: {
    flex: 1.2,
  },
  flexListBtn: {
    flex: 1,
  },
  railSection: {
    marginTop: 24,
  },
  railHeader: {
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  railScroll: {
    paddingHorizontal: 14,
    gap: 10,
  },
  top10Card: {
    width: 125,
    height: 175,
  },
  posterCard: {
    width: 110,
    height: 165,
  },
  landscapeCard: {
    width: 220,
    height: 124,
  },
  bottomSpacer: {
    height: 90,
  },
});
