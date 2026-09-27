import React, { useState, memo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  Platform,
} from 'react-native';
import { StudioInfo, POPULAR_STUDIOS } from '../../services/tmdb';
import { TVFocusable } from '../common/TVFocusable';
import { useDeviceMode } from '../../hooks/useDeviceMode';

interface StudioRailProps {
  onSelectStudio: (studio: StudioInfo) => void;
  onViewAll?: () => void;
}

interface StudioCardItemProps {
  studio: StudioInfo;
  isTV: boolean;
  onSelect: (studio: StudioInfo) => void;
}

const StudioCardItem = memo(function StudioCardItem({
  studio,
  isTV,
  onSelect,
}: StudioCardItemProps) {
  const [errCount, setErrCount] = useState(0);
  const currentUri =
    errCount === 0
      ? studio.logoUrl
      : errCount === 1
        ? studio.webFallbackUrl
        : null;

  const handlePress = useCallback(() => {
    onSelect(studio);
  }, [studio, onSelect]);

  return (
    <TVFocusable
      style={[styles.card, isTV && styles.cardTV]}
      focusedStyle={styles.cardFocused}
      onPress={handlePress}>
      <View style={styles.cardInner}>
        {currentUri ? (
          <Image
            source={{ uri: currentUri }}
            style={[styles.logoImage, { tintColor: '#FFFFFF' }]}
            resizeMode="contain"
            onError={() => setErrCount(prev => prev + 1)}
          />
        ) : (
          <Text
            style={[
              styles.fallbackText,
              { color: studio.color || '#FFFFFF' },
            ]}>
            {studio.name}
          </Text>
        )}
      </View>
    </TVFocusable>
  );
});

export const StudioRail = memo(function StudioRail({
  onSelectStudio,
  onViewAll,
}: StudioRailProps) {
  const { isTV } = useDeviceMode();

  const renderItem = useCallback(
    ({ item }: { item: StudioInfo }) => (
      <StudioCardItem
        studio={item}
        isTV={isTV}
        onSelect={onSelectStudio}
      />
    ),
    [isTV, onSelectStudio]
  );

  const keyExtractor = useCallback(
    (item: StudioInfo) => `studio-${item.id}`,
    []
  );

  const cardWidth = isTV ? 196 + 16 : 156 + 12;
  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: cardWidth,
      offset: cardWidth * index,
      index,
    }),
    [cardWidth]
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.headerTitleWrap}>
          {/* <View style={styles.accentDot} /> */}
          <Text style={styles.title}>Studios & Networks</Text>
        </View>
        {onViewAll ? (
          <TVFocusable
            style={styles.viewAllBtn}
            focusedStyle={styles.viewAllBtnFocused}
            onPress={onViewAll}>
            <Text style={styles.viewAllText}>View All &gt;</Text>
          </TVFocusable>
        ) : (
          <Text style={styles.subTitle}>Explore All Catalogs</Text>
        )}
      </View>

      <FlatList
        horizontal
        data={POPULAR_STUDIOS}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, isTV && styles.scrollTV]}
        initialNumToRender={5}
        maxToRenderPerBatch={4}
        windowSize={3}
        removeClippedSubviews={Platform.OS === 'android'}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    marginBottom: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#38BDF8',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  subTitle: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  viewAllBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  viewAllBtnFocused: {
    backgroundColor: '#FFFFFF',
    transform: [{ scale: 1.08 }],
  },
  viewAllText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  scroll: {
    paddingHorizontal: 16,
  },
  scrollTV: {
    paddingHorizontal: 28,
  },
  card: {
    width: 156,
    height: 82,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#0F121A',
    marginRight: 12,
  },
  cardTV: {
    width: 196,
    height: 98,
    borderRadius: 16,
    marginRight: 16,
  },
  cardFocused: {
    borderColor: '#FFFFFF',
    borderWidth: 2,
    backgroundColor: '#1E2333',
    transform: [{ scale: 1.07 }],
    elevation: 10,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  cardInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  fallbackText: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
});
