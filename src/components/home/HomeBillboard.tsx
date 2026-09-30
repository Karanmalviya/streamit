import React, { useRef, useState, useEffect, memo, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
} from 'react-native';
import Video, { ResizeMode, ViewType } from 'react-native-video';
import {
  MediaItem,
  MediaExtendedDetails,
  fetchMediaTrailer,
  fetchMediaLogo,
  fetchMediaExtendedDetails,
} from '../../services/tmdb';
import {
  BillboardFadedOverlay,
  BillboardTopVignette,
  BillboardSideOverlay,
} from '../common/FadedOverlay';
import { TVFocusable } from '../common/TVFocusable';
import { VolumeIcon, VolumeMuteIcon } from '../common/Icons';
import { useDeviceMode } from '../../hooks/useDeviceMode';

interface HomeBillboardProps {
  heroes: MediaItem[];
  topInset: number;
  isBannerInView?: boolean;
  onSelectMedia: (item: MediaItem) => void;
  onToggleWatchlist?: (item: MediaItem) => void;
  isInWatchlist?: (id: number) => boolean;
}

interface HeroSlideProps {
  hero: MediaItem;
  isActive: boolean;
  isBannerInView?: boolean;
  isMuted: boolean;
  screenWidth: number;
  billboardTotalHeight: number;
  billboardHeight: number;
  fadeHeight: number;
  imageTop: number;
  isWide: boolean;
  failedLogo: boolean;
  onFailedLogo: (id: number) => void;
  onSelect: (item: MediaItem) => void;
  onTrailerEnded: () => void;
  onToggleMute: () => void;
}

const HeroSlide = memo(function HeroSlideComponent({
  hero,
  isActive,
  isBannerInView = true,
  isMuted,
  screenWidth,
  billboardTotalHeight,
  billboardHeight,
  fadeHeight,
  imageTop,
  isWide,
  failedLogo,
  onFailedLogo,
  onSelect,
  onTrailerEnded,
  onToggleMute,
}: HeroSlideProps) {
  const [trailerUrl, setTrailerUrl] = useState<string | null>(hero.trailerUrl || null);
  const [titleLogo, setTitleLogo] = useState<string | null>(hero.titleLogo || null);
  const [extendedDetails, setExtendedDetails] = useState<MediaExtendedDetails | null>(null);
  const [showTrailer, setShowTrailer] = useState(false);

  // Fetch trailer, logo, and extended details if not pre-populated
  useEffect(() => {
    let isMounted = true;

    if (hero.trailerUrl) {
      setTrailerUrl(hero.trailerUrl);
    } else {
      fetchMediaTrailer(hero.id, hero.type)
        .then(tData => {
          if (isMounted && tData?.url) {
            setTrailerUrl(tData.url);
          }
        })
        .catch(() => {});
    }

    if (hero.titleLogo) {
      setTitleLogo(hero.titleLogo);
    } else {
      fetchMediaLogo(hero.id, hero.type)
        .then(logo => {
          if (isMounted && logo) {
            setTitleLogo(logo);
          }
        })
        .catch(() => {});
    }

    fetchMediaExtendedDetails(hero.id, hero.type)
      .then(extData => {
        if (isMounted && extData) {
          setExtendedDetails(extData);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [hero]);

  // Use backdrop artwork for cinematic billboard presentation (fallback to poster if unavailable)
  const imageUri = hero.backdrop || hero.poster || undefined;

  // Show poster first; after 2 seconds on the active slide, start playing the trailer
  useEffect(() => {
    let delayTimer: any = null;
    if (isActive && trailerUrl && isBannerInView) {
      delayTimer = setTimeout(() => {
        setShowTrailer(true);
      }, 2000);
    } else {
      setShowTrailer(false);
    }

    return () => {
      if (delayTimer) clearTimeout(delayTimer);
    };
  }, [isActive, trailerUrl, isBannerInView]);

  const handleSelect = useCallback(() => {
    onSelect(hero);
  }, [hero, onSelect]);

  const handleLogoError = useCallback(() => {
    onFailedLogo(hero.id);
  }, [hero.id, onFailedLogo]);

  // Certification badge matching Details page
  const displayCertification = useMemo(() => {
    const raw = extendedDetails?.certification?.trim();
    if (!raw) return hero.type === 'movie' ? 'U/A 13+' : 'U/A 16+';
    if (raw === '18+' || raw === 'A' || raw === 'R' || raw === 'TV-MA' || raw === 'NC-17') return 'U/A 18+';
    if (raw === '16+' || raw === 'TV-14' || raw === '15') return 'U/A 16+';
    if (raw === '13+' || raw === 'PG-13' || raw === '12') return 'U/A 13+';
    if (raw === 'U' || raw === 'G' || raw === 'TV-G' || raw === 'TV-Y' || raw === 'PG') return 'U';
    return raw.startsWith('U/A') ? raw : `U/A ${raw}`;
  }, [extendedDetails?.certification, hero.type]);

  const displayRuntime = extendedDetails?.runtimeFormatted;

  const displayLanguages = useMemo(() => {
    if (extendedDetails?.spokenLanguages && extendedDetails.spokenLanguages.length > 0) {
      return extendedDetails.spokenLanguages.slice(0, 3).join(', ');
    }
    return hero.language || 'English';
  }, [extendedDetails?.spokenLanguages, hero.language]);

  const horizontalPadding = isWide ? 28 : 14;
  const cardWidth = screenWidth - horizontalPadding * 2;

  return (
    <View style={[styles.slide, { width: screenWidth, height: billboardTotalHeight }]}>
      <TVFocusable
        style={[
          styles.slideCard,
          {
            width: cardWidth,
            height: billboardHeight,
            marginTop: imageTop,
          },
        ]}
        focusedStyle={styles.slideCardFocused}
        hasTVPreferredFocus={true}
        onPress={handleSelect}>
        {/* 1. Backdrop / Poster Image (Shown immediately) */}
        <Image
          source={{ uri: imageUri }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />

        {/* 2. Direct MP4 Trailer Video Stream (via native ExoPlayer) */}
        {isActive && showTrailer && trailerUrl ? (
          <View style={styles.trailerContainer} pointerEvents="none">
            <Video
              key={`native-video-${hero.id}-${trailerUrl}`}
              source={{ uri: trailerUrl }}
              style={styles.nativeVideo}
              resizeMode={ResizeMode.COVER}
              useTextureView={true}
              viewType={ViewType.TEXTURE}
              muted={isMuted}
              repeat={true}
              paused={!isActive || !showTrailer || !isBannerInView}
              playInBackground={false}
              playWhenInactive={false}
              ignoreSilentSwitch="ignore"
              onError={onTrailerEnded}
            />
          </View>
        ) : null}

        {/* 4. Top Vignette */}
        <BillboardTopVignette height={60} />

        {/* 5. Left-to-right Side Vignette on Wide / TV screens */}
        {isWide && <BillboardSideOverlay width={Math.min(cardWidth * 0.55, 520)} />}

        {/* 6. Ultra-smooth Bottom Cinematic Faded Gradient (Extended to cover full bottom with zero gap) */}
        <View style={styles.bottomOverlayWrap} pointerEvents="none">
          <BillboardFadedOverlay height={fadeHeight + 14} />
        </View>

        {/* 7. Minimalist Content Overlay */}
        <View style={[styles.content, isWide && styles.contentWide]}>
          {/* Title Logo Artwork or Bold Typography */}
          {titleLogo && !failedLogo ? (
            <Image
              source={{ uri: titleLogo }}
              style={[styles.titleLogo, isWide && styles.titleLogoWide]}
              resizeMode="contain"
              onError={handleLogoError}
            />
          ) : (
            <Text
              style={[styles.title, isWide && styles.titleWide]}
              numberOfLines={2}>
              {hero.title}
            </Text>
          )}

          {/* Metadata Badges Row: Year · U/A Certification · Runtime · Languages · 4K UHD · DOLBY 5.1 */}
          <View style={styles.metaRow}>
            {hero.year && hero.year !== 'N/A' && (
              <Text style={styles.metaYear}>{hero.year}</Text>
            )}

            <View style={styles.metaDot} />

            <View style={styles.tagPill}>
              <Text style={styles.tagPillText}>{displayCertification}</Text>
            </View>

            {displayRuntime ? (
              <>
                <View style={styles.metaDot} />
                <Text style={styles.metaRuntime}>{displayRuntime}</Text>
              </>
            ) : null}

            {displayLanguages ? (
              <>
                <View style={styles.metaDot} />
                <Text style={styles.metaLanguages} numberOfLines={1}>
                  {displayLanguages}
                </Text>
              </>
            ) : null}
          </View>
        </View>

        {/* Top Right Corner Mute/Unmute Trailer Button (Only visible when trailer appears/plays) */}
        {isActive && showTrailer && trailerUrl && isBannerInView ? (
          <View style={styles.bannerMuteWrap} pointerEvents="box-none">
            <TVFocusable
              style={styles.bannerMuteBtn}
              focusedStyle={styles.bannerMuteBtnFocused}
              activeOpacity={0.7}
              onPress={onToggleMute}>
              {isMuted ? (
                <VolumeMuteIcon color="#FFFFFF" size={22} />
              ) : (
                <VolumeIcon color="#FFFFFF" size={22} />
              )}
            </TVFocusable>
          </View>
        ) : null}
      </TVFocusable>
    </View>
  );
});

export const HomeBillboard = memo(function HomeBillboardComponent({
  heroes,
  topInset,
  isBannerInView = true,
  onSelectMedia,
}: HomeBillboardProps) {
  const [heroIndex, setHeroIndex] = useState(0);
  const heroIndexRef = useRef(0);
  heroIndexRef.current = heroIndex;
  const [isMuted, setIsMuted] = useState(true);
  const [failedLogos, setFailedLogos] = useState<Record<number, boolean>>({});
  const scrollRef = useRef<any>(null);
  const { width: screenWidth, height: screenHeight, isLandscape, isTV } = useDeviceMode();

  const handleToggleMute = useCallback(() => {
    setIsMuted(m => !m);
  }, []);

  const handleFailedLogo = useCallback((id: number) => {
    setFailedLogos(prev => ({ ...prev, [id]: true }));
  }, []);

  // Advance to next hero slide
  const advanceToNextSlide = useCallback(() => {
    if (heroes.length <= 1) return;
    const nextIdx = (heroIndexRef.current + 1) % heroes.length;
    scrollRef.current?.scrollTo({ x: nextIdx * screenWidth, animated: true });
    setHeroIndex(nextIdx);
    heroIndexRef.current = nextIdx;
  }, [heroes.length, screenWidth]);

  // Re-align scroll position immediately whenever screen width or orientation changes
  useEffect(() => {
    scrollRef.current?.scrollTo({
      x: heroIndexRef.current * screenWidth,
      animated: false,
    });
  }, [screenWidth]);

  const handleScrollLayout = useCallback(() => {
    scrollRef.current?.scrollTo({
      x: heroIndexRef.current * screenWidth,
      animated: false,
    });
  }, [screenWidth]);

  // Handle trailer completion: advance immediately when trailer finishes
  const handleTrailerEnded = useCallback(() => {
    advanceToNextSlide();
  }, [advanceToNextSlide]);

  // Auto-slide timer:
  useEffect(() => {
    if (heroes.length <= 1) return;
    const currentHero = heroes[heroIndex];
    const hasTrailer = Boolean(currentHero?.trailerUrl || currentHero?.trailerKey);
    const delay = hasTrailer ? 75000 : 7000;

    const timer = setTimeout(() => {
      advanceToNextSlide();
    }, delay);

    return () => clearTimeout(timer);
  }, [heroIndex, heroes, advanceToNextSlide]);

  if (!heroes || !heroes.length) return null;

  const isWide = isTV || isLandscape;
  const horizontalPadding = isWide ? 28 : 14;
  const cardWidth = screenWidth - horizontalPadding * 2;
  const navbarHeight = isWide ? 0 : topInset + 60;
  const billboardHeight = isWide
    ? Math.round(Math.min(screenHeight * 0.72, 460))
    : Math.round(cardWidth * (9 / 16));

  const imageTop = isWide ? 14 : navbarHeight + 14;
  const billboardTotalHeight = billboardHeight + imageTop;
  const fadeHeight = Math.round(billboardHeight * (isWide ? 0.82 : 0.90));

  return (
    <View style={[styles.rootContainer, { width: screenWidth }]}>
      <View style={[styles.container, { width: screenWidth, height: billboardTotalHeight }]}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          decelerationRate="fast"
          removeClippedSubviews={false}
          onLayout={handleScrollLayout}
          onMomentumScrollEnd={e => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
            if (idx >= 0 && idx < heroes.length) {
              setHeroIndex(idx);
              heroIndexRef.current = idx;
            }
          }}
          onScrollEndDrag={e => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
            if (idx >= 0 && idx < heroes.length) {
              setHeroIndex(idx);
              heroIndexRef.current = idx;
            }
          }}>
          {heroes.map((hero, index) => (
            <HeroSlide
              key={`billboard-${hero.id}`}
              hero={hero}
              isActive={heroIndex === index}
              isBannerInView={isBannerInView}
              isMuted={isMuted}
              screenWidth={screenWidth}
              billboardTotalHeight={billboardTotalHeight}
              billboardHeight={billboardHeight}
              fadeHeight={fadeHeight}
              imageTop={imageTop}
              isWide={isWide}
              failedLogo={!!failedLogos[hero.id]}
              onFailedLogo={handleFailedLogo}
              onSelect={onSelectMedia}
              onTrailerEnded={handleTrailerEnded}
              onToggleMute={handleToggleMute}
            />
          ))}
        </ScrollView>
      </View>

      {/* Centralized Slider Dots in Theme Color (Placed below banner) */}
      <View style={[styles.dotsContainer, isWide && styles.dotsContainerWide]}>
        {heroes.map((_, i) => (
          <View
            key={`dot-${i}`}
            style={[
              styles.pillDot,
              heroIndex === i ? styles.pillDotActive : styles.pillDotInactive,
            ]}
          />
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  rootContainer: {
    backgroundColor: '#040406',
  },
  container: {
    position: 'relative',
    backgroundColor: '#040406',
  },
  slide: {
    alignItems: 'center',
    backgroundColor: '#040406',
  },
  slideCard: {
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#040406',
    position: 'relative',
  },
  slideCardFocused: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.015 }],
  },
  bottomOverlayWrap: {
    position: 'absolute',
    bottom: -8,
    left: 0,
    right: 0,
  },
  trailerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    backgroundColor: '#040406',
  },
  nativeVideo: {
    width: '100%',
    height: '100%',
    transform: [{ scale: 1.34 }],
    backgroundColor: '#040406',
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 10,
    justifyContent: 'flex-end',
    pointerEvents: 'none',
  },
  contentWide: {
    paddingHorizontal: 36,
    paddingBottom: 16,
    maxWidth: 640,
  },
  titleLogo: {
    width: 170,
    height: 44,
    marginBottom: 6,
    alignSelf: 'flex-start',
  },
  titleLogoWide: {
    width: 320,
    height: 78,
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  titleWide: {
    fontSize: 32,
    lineHeight: 38,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  metaYear: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
    marginRight: 2,
  },
  metaDot: {
    width: 3.5,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: '#64748B',
    marginHorizontal: 1,
  },
  tagPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  tagPillText: {
    color: '#CBD0DF',
    fontSize: 9,
    fontWeight: '800',
  },
  metaRuntime: {
    color: '#A0AEC0',
    fontSize: 12,
    fontWeight: '600',
    marginRight: 2,
  },
  metaLanguages: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
    gap: 6,
  },
  dotsContainerWide: {
    paddingTop: 14,
    paddingBottom: 6,
    gap: 7,
  },
  pillDot: {
    height: 3.5,
    borderRadius: 2,
  },
  pillDotActive: {
    width: 22,
    backgroundColor: '#E50914',
  },
  pillDotInactive: {
    width: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  bannerMuteWrap: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    zIndex: 99,
    elevation: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerMuteBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  bannerMuteBtnFocused: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 6,
    transform: [{ scale: 1.15 }],
  },
});
