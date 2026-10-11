import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, Image, StyleSheet, Platform, Pressable } from 'react-native';
import Svg, { Text as SvgText } from 'react-native-svg';
import { MediaItem, fetchMediaLogo } from '../../services/tmdb';
import { TVFocusable } from '../common/TVFocusable';
import { TVFixedFocusShelf } from '../common/TVFixedFocusShelf';
import { useDeviceMode } from '../../hooks/useDeviceMode';
import { tvNavigation } from '../../services/tvNavigation';

const TOP10_CARD_WIDTH = 270;
const TOP10_CARD_HEIGHT = 152;
const NUMBER_CONTAINER_WIDTH = 60;
const NUMBER_OVERLAP = Math.round(NUMBER_CONTAINER_WIDTH * 0.15); // 15% of the number width behind the poster
const ITEM_GAP = 20;
const ITEM_TOTAL_WIDTH = (NUMBER_CONTAINER_WIDTH - NUMBER_OVERLAP) + TOP10_CARD_WIDTH + ITEM_GAP;

interface Top10RailProps {
  title?: string;
  subTitle?: string;
  items: MediaItem[];
  railId?: string;
  onSelectMedia: (item: MediaItem) => void;
  onViewAll?: () => void;
  onFocus?: () => void;
}

interface Top10InnerProps {
  item: MediaItem;
  rank: number;
}

const Top10Inner = memo(function Top10InnerComponent({ item, rank }: Top10InnerProps) {
  const [logoUrl, setLogoUrl] = useState<string | null | undefined>(item.titleLogo);

  useEffect(() => {
    if (logoUrl === undefined) {
      fetchMediaLogo(item.id, item.type)
        .then(url => {
          setLogoUrl(url || null);
        })
        .catch(() => {
          setLogoUrl(null);
        });
    }
  }, [item.id, item.type, logoUrl]);

  return (
    <View style={styles.cardWrapper}>
      {/* Stylized Rank Number (Layered behind the poster) */}
      <View style={styles.numberWrapper}>
        <Svg
          height="90"
          width={NUMBER_CONTAINER_WIDTH}
          viewBox={`0 0 ${NUMBER_CONTAINER_WIDTH} 90`}
          style={styles.svgNumber}>
          <SvgText
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="3.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            fontSize="76"
            fontFamily="sans-serif"
            x={NUMBER_CONTAINER_WIDTH / 2}
            y="74"
            textAnchor="middle"
            letterSpacing={rank === 10 ? -5 : -3}>
            {rank}
          </SvgText>
        </Svg>
      </View>

      {/* Poster Artwork Container */}
      <View style={styles.posterContainer}>
        {item.backdrop || item.poster ? (
          <Image
            source={{ uri: item.backdrop || item.poster || undefined }}
            style={styles.posterImg}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.fallbackPoster}>
            <Text style={styles.fallbackText}>{item.title}</Text>
          </View>
        )}
        <View style={styles.cardOverlay}>
          <View style={styles.bottomContent}>
            {logoUrl ? (
              <Image source={{ uri: logoUrl }} style={styles.titleLogo} resizeMode="contain" />
            ) : (
              <Text style={styles.movieTitle} numberOfLines={2}>{item.title.toUpperCase()}</Text>
            )}

            <View style={styles.detailsOverlay}>
              <View style={styles.ageRating}>
                <Text style={styles.ageText}>A</Text>
              </View>
              <Text style={styles.genresText} numberOfLines={1}>
                {item.genres.join('  ')}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
});

interface Top10CardProps {
  item: MediaItem;
  rank: number;
  index: number;
  onSelect: (item: MediaItem) => void;
  onCardFocus?: (index: number) => void;
}

const Top10Card = memo(function Top10CardComponent({ item, rank, onSelect }: Top10CardProps) {
  const handlePress = useCallback(() => {
    onSelect(item);
  }, [item, onSelect]);

  return (
    <Pressable onPress={handlePress}>
      <Top10Inner item={item} rank={rank} />
    </Pressable>
  );
});

export const Top10Rail = memo(function Top10RailComponent({
  title = 'Top 10 This Week',
  subTitle = 'Trending',
  items,
  railId = 'top10',
  onSelectMedia,
  onViewAll,
  onFocus,
}: Top10RailProps) {
  const { isTV } = useDeviceMode();
  const flatListRef = useRef<FlatList>(null);

  const handleCardFocus = useCallback((index: number) => {
    if (onFocus) onFocus();
    try {
      flatListRef.current?.scrollToIndex({
        index,
        viewPosition: 0.2,
        animated: true,
      });
    } catch {
      // ignore
    }
  }, [onFocus]);

  const renderItem = useCallback(
    ({ item, index }: { item: MediaItem; index: number }) => (
      <Top10Card
        item={item}
        rank={index + 1}
        index={index}
        onSelect={onSelectMedia}
        onCardFocus={handleCardFocus}
      />
    ),
    [onSelectMedia, handleCardFocus]
  );

  const keyExtractor = useCallback(
    (item: MediaItem) => `top10-${item.id}`,
    []
  );

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: ITEM_TOTAL_WIDTH,
      offset: ITEM_TOTAL_WIDTH * index,
      index,
    }),
    []
  );

  if (!items || !items.length) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <Text style={styles.title}>{title}</Text>
          {subTitle && <Text style={styles.subTitle}>{subTitle}</Text>}
        </View>
        {onViewAll && (
          <TVFocusable
            style={styles.viewAllBtn}
            focusedStyle={styles.viewAllBtnFocused}
            borderRadius={6}
            disabled={isTV}
            onFocus={onFocus}
            onPress={onViewAll}>
            <Text style={styles.viewAllText}>View All &gt;</Text>
          </TVFocusable>
        )}
      </View>

      {isTV ? (
        <TVFixedFocusShelf
          data={items}
          itemWidth={ITEM_TOTAL_WIDTH}
          cardWidth={TOP10_CARD_WIDTH}
          cardHeight={TOP10_CARD_HEIGHT}
          borderRadius={8}
          anchorLeft={14 + NUMBER_CONTAINER_WIDTH - NUMBER_OVERLAP}
          anchorTop={12}
          paddingLeft={14}
          paddingTop={12}
          paddingBottom={16}
          railId={railId}
          onSelect={onSelectMedia}
          onFocus={onFocus}
          onPressLeftAtStart={() => tvNavigation.focusSidebar('home')}
          renderItem={(item, index) => (
            <Top10Inner key={`tv-top10-${item.id}-${index}`} item={item} rank={index + 1} />
          )}
        />
      ) : (
        <FlatList
          ref={flatListRef}
          horizontal
          data={items}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          getItemLayout={getItemLayout}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          initialNumToRender={5}
          maxToRenderPerBatch={5}
          windowSize={5}
          removeClippedSubviews={Platform.OS === 'android'}
          snapToInterval={ITEM_TOTAL_WIDTH}
          snapToAlignment="start"
          decelerationRate="fast"
          disableIntervalMomentum={true}
        />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginTop: 22,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  subTitle: {
    fontSize: 11,
    color: '#70778C',
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
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  cardWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: NUMBER_CONTAINER_WIDTH - NUMBER_OVERLAP + TOP10_CARD_WIDTH,
    marginRight: ITEM_GAP,
    marginBottom: 10,
  },
  cardFocused: {
    zIndex: 10,
  },
  numberWrapper: {
    width: NUMBER_CONTAINER_WIDTH,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: -NUMBER_OVERLAP,
    zIndex: 1,
  },
  svgNumber: {
    alignSelf: 'center',
  },
  posterContainer: {
    width: TOP10_CARD_WIDTH,
    height: TOP10_CARD_HEIGHT,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#07080B',
    zIndex: 2,
  },
  posterImg: {
    width: '100%',
    height: '100%',
  },
  cardOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.15)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 8,
  },
  bottomContent: {
    alignItems: 'center',
    width: '100%',
  },
  titleLogo: {
    width: 140,
    height: 40,
    marginBottom: 6,
  },
  movieTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 3,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    marginBottom: 6,
  },
  detailsOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
  },
  ageRating: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  ageText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  genresText: {
    color: '#D1D5DB',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
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
});
