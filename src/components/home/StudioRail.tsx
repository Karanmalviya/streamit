import React, { useState, useRef, useEffect, memo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  Platform,
} from 'react-native';
import { StudioInfo, HOME_FEATURED_STUDIOS } from '../../services/tmdb';
import { TVFocusable } from '../common/TVFocusable';
import { TVFixedFocusShelf } from '../common/TVFixedFocusShelf';
import { useDeviceMode } from '../../hooks/useDeviceMode';
import { tvNavigation } from '../../services/tvNavigation';

interface StudioRailProps {
  onSelectStudio: (studio: StudioInfo) => void;
  onViewAll?: () => void;
  onFocus?: () => void;
}

interface StudioCardItemProps {
  studio: StudioInfo;
  index: number;
  isTV: boolean;
  onSelect: (studio: StudioInfo) => void;
  onCardFocus?: (index: number) => void;
}

const TILE_SIZE_MOBILE = 76;
const TILE_GAP_MOBILE = 14;
const TILE_SIZE_TV = 96;
const TILE_GAP_TV = 18;

const StudioLogoContent = memo(function StudioLogoContent({
  studio,
  isTV,
}: {
  studio: StudioInfo;
  isTV: boolean;
}) {
  const [errCount, setErrCount] = useState(0);
  const currentUri =
    errCount === 0
      ? studio.logoUrl
      : errCount === 1
        ? studio.webFallbackUrl
        : null;

  const isAppIcon =
    studio.isAppIcon ??
    ['netflix', 'disney', 'jiohotstar', 'prime', 'appletv', 'hulu', 'paramount', 'peacock', 'crunchyroll', 'zee5', 'sonyliv', 'starz'].includes(
      studio.id
    );

  if (currentUri) {
    if (isAppIcon) {
      return (
        <Image
          source={{ uri: currentUri }}
          style={styles.tileImage}
          resizeMode="cover"
          onError={() => setErrCount(prev => prev + 1)}
        />
      );
    }
    return (
      <View style={[styles.logoPaddedWrap, isTV && styles.logoPaddedWrapTV]}>
        <Image
          source={{ uri: currentUri }}
          style={styles.tileImageContain}
          resizeMode="contain"
          onError={() => setErrCount(prev => prev + 1)}
        />
      </View>
    );
  }

  return (
    <View style={[styles.fallbackWrap, { backgroundColor: studio.bgColor || '#161922' }]}>
      <Text
        style={[
          styles.fallbackText,
          { color: studio.color || '#FFFFFF' },
        ]}>
        {studio.logoText || studio.name}
      </Text>
    </View>
  );
});

const StudioCardItem = memo(function StudioCardItem({
  studio,
  index,
  isTV,
  onSelect,
  onCardFocus,
}: StudioCardItemProps) {
  const cardRef = useRef<any>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (index === 0 && cardRef.current) {
      tvNavigation.registerFirstRailFirstItem(cardRef.current);
    }
  }, [index]);

  const handlePress = useCallback(() => {
    onSelect(studio);
  }, [studio, onSelect]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    if (onCardFocus) onCardFocus(index);
    if (cardRef.current) {
      tvNavigation.setLastFocusedContent(cardRef.current);
      tvNavigation.setFocusedContent('studios', index, cardRef.current);
    }
  }, [index, onCardFocus]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  return (
    <View style={[styles.itemWrapper, isTV && styles.itemWrapperTV]}>
      <TVFocusable
        ref={cardRef}
        style={[
          styles.tileCard,
          isTV && styles.tileCardTV,
          { backgroundColor: studio.bgColor || '#000000' },
        ]}
        focusedStyle={styles.cardFocused}
        borderRadius={isTV ? 20 : 16}
        onPressLeft={index === 0 ? () => tvNavigation.focusSidebar('home') : undefined}
        onPressUp={index === 0 ? () => tvNavigation.focusBillboard() : undefined}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onPress={handlePress}>
        <StudioLogoContent studio={studio} isTV={isTV} />
      </TVFocusable>
      <Text
        style={[styles.tileLabel, isTV && styles.tileLabelTV, isFocused && styles.tileLabelFocused]}
        numberOfLines={1}>
        {studio.name}
      </Text>
    </View>
  );
});

export const StudioRail = memo(function StudioRail({
  onSelectStudio,
  onViewAll,
  onFocus,
}: StudioRailProps) {
  const { isTV } = useDeviceMode();
  const flatListRef = React.useRef<FlatList>(null);

  const handleCardFocus = useCallback(
    (index: number) => {
      if (onFocus) onFocus();
      try {
        flatListRef.current?.scrollToIndex({
          index,
          viewPosition: 0.2,
          animated: true,
        });
      } catch {
        // ignore out of bounds
      }
    },
    [onFocus]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: StudioInfo; index: number }) => (
      <StudioCardItem
        studio={item}
        index={index}
        isTV={isTV}
        onSelect={onSelectStudio}
        onCardFocus={handleCardFocus}
      />
    ),
    [isTV, onSelectStudio, handleCardFocus]
  );

  const keyExtractor = useCallback(
    (item: StudioInfo) => `studio-${item.id}`,
    []
  );

  const itemWidth = isTV ? TILE_SIZE_TV + TILE_GAP_TV : TILE_SIZE_MOBILE + TILE_GAP_MOBILE;
  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: itemWidth,
      offset: itemWidth * index,
      index,
    }),
    [itemWidth]
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.title}>Studios & Networks</Text>
        </View>
        {onViewAll ? (
          <TVFocusable
            style={styles.viewAllBtn}
            focusedStyle={styles.viewAllBtnFocused}
            borderRadius={6}
            disabled={isTV}
            onFocus={onFocus}
            onPress={onViewAll}>
            <Text style={styles.viewAllText}>View All &gt;</Text>
          </TVFocusable>
        ) : (
          <Text style={styles.subTitle}>Explore All Catalogs</Text>
        )}
      </View>

      {isTV ? (
        <TVFixedFocusShelf
          data={HOME_FEATURED_STUDIOS}
          itemWidth={TILE_SIZE_TV + TILE_GAP_TV}
          cardWidth={TILE_SIZE_TV}
          cardHeight={TILE_SIZE_TV}
          borderRadius={20}
          anchorLeft={28}
          anchorTop={16}
          paddingLeft={28}
          railId="studios"
          isFirstRail={true}
          onSelect={onSelectStudio}
          onFocus={onFocus}
          onPressUp={() => tvNavigation.focusBillboard()}
          onPressLeftAtStart={() => tvNavigation.focusSidebar('home')}
          renderItem={(studio, index, isActive, isRailFocused) => (
            <View key={`tv-studio-${studio.id}`} style={styles.itemWrapperTV}>
              <View
                style={[
                  styles.tileCard,
                  styles.tileCardTV,
                  { backgroundColor: studio.bgColor || '#000000' },
                  isActive && isRailFocused && styles.tileCardActiveTV,
                ]}>
                <StudioLogoContent studio={studio} isTV={true} />
              </View>
              <Text
                style={[
                  styles.tileLabel,
                  styles.tileLabelTV,
                  isActive && isRailFocused && styles.tileLabelFocused,
                ]}
                numberOfLines={1}>
                {studio.name}
              </Text>
            </View>
          )}
        />
      ) : (
        <FlatList
          ref={flatListRef}
          horizontal
          data={HOME_FEATURED_STUDIOS}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          getItemLayout={getItemLayout}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          initialNumToRender={8}
          maxToRenderPerBatch={6}
          windowSize={3}
          removeClippedSubviews={Platform.OS === 'android'}
        />
      )}
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
  scroll: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  scrollTV: {
    paddingHorizontal: 28,
    paddingVertical: 16,
  },
  itemWrapper: {
    width: TILE_SIZE_MOBILE,
    alignItems: 'center',
    marginRight: TILE_GAP_MOBILE,
  },
  itemWrapperTV: {
    width: TILE_SIZE_TV,
    marginRight: TILE_GAP_TV,
  },
  tileCard: {
    width: TILE_SIZE_MOBILE,
    height: TILE_SIZE_MOBILE,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  tileCardTV: {
    width: TILE_SIZE_TV,
    height: TILE_SIZE_TV,
    borderRadius: 20,
  },
  tileImage: {
    width: '100%',
    height: '100%',
  },
  logoPaddedWrap: {
    flex: 1,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoPaddedWrapTV: {
    padding: 14,
  },
  tileImageContain: {
    width: '100%',
    height: '100%',
  },
  fallbackWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
  },
  fallbackText: {
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
  },
  cardFocused: {
    zIndex: 10,
  },
  tileLabel: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    textAlign: 'center',
    width: '100%',
  },
  tileLabelTV: {
    fontSize: 13,
    marginTop: 10,
  },
  tileLabelFocused: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  tileCardActiveTV: {
    transform: [{ scale: 1.05 }],
  },
});
