import React, { useRef, useState, useEffect, memo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
} from 'react-native';
import Video, { ResizeMode } from 'react-native-video';
import { WebView } from 'react-native-webview';
import { MediaItem } from '../../services/tmdb';
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
  onSelectMedia: (item: MediaItem) => void;
  onToggleWatchlist?: (item: MediaItem) => void;
  isInWatchlist?: (id: number) => boolean;
}

interface HeroSlideProps {
  hero: MediaItem;
  isActive: boolean;
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
}

const HeroSlide = memo(function HeroSlideComponent({
  hero,
  isActive,
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
}: HeroSlideProps) {
  const [showTrailer, setShowTrailer] = useState(false);
  const hasTrailer = Boolean(hero.trailerUrl || hero.trailerKey);

  // Use backdrop artwork for cinematic billboard presentation (fallback to poster if unavailable)
  const imageUri = hero.backdrop || hero.poster || undefined;

  // Show poster first; after 2 seconds on the active slide, start playing the trailer
  useEffect(() => {
    let delayTimer: any = null;
    if (isActive && hasTrailer) {
      delayTimer = setTimeout(() => {
        setShowTrailer(true);
      }, 2000);
    } else {
      setShowTrailer(false);
    }

    return () => {
      if (delayTimer) clearTimeout(delayTimer);
    };
  }, [isActive, hasTrailer]);

  const webViewRef = useRef<any>(null);

  // Sync mute/unmute state with embedded YouTube trailer
  useEffect(() => {
    if (showTrailer && webViewRef.current) {
      const js = isMuted
        ? 'if (window.__ytPlayer && window.__ytPlayer.mute) { window.__ytPlayer.mute(); } true;'
        : 'if (window.__ytPlayer && window.__ytPlayer.unMute) { window.__ytPlayer.unMute(); window.__ytPlayer.setVolume(100); } true;';
      webViewRef.current.injectJavaScript(js);
    }
  }, [isMuted, showTrailer]);

  const handleSelect = useCallback(() => {
    onSelect(hero);
  }, [hero, onSelect]);

  const handleLogoError = useCallback(() => {
    onFailedLogo(hero.id);
  }, [hero.id, onFailedLogo]);

  const handleWebViewMessage = useCallback(
    (event: any) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.event === 'ended' || data.event === 'error') {
          setShowTrailer(false);
          onTrailerEnded();
        }
      } catch {
        setShowTrailer(false);
      }
    },
    [onTrailerEnded]
  );

  return (
    <TVFocusable
      style={[
        styles.slide,
        { width: screenWidth, height: billboardTotalHeight },
      ]}
      focusedStyle={styles.slideFocused}
      hasTVPreferredFocus={true}
      onPress={handleSelect}>
      {/* 1. Backdrop / Poster Image (Shown immediately) */}
      <Image
        source={{ uri: imageUri }}
        style={[
          styles.backdropImage,
          {
            top: imageTop,
            width: screenWidth,
            height: billboardHeight,
          },
        ]}
        resizeMode="cover"
      />

      {/* 2. Direct MP4 Trailer Video Stream (e.g. IMDb / shegu.st via native ExoPlayer) */}
      {isActive && showTrailer && hero.trailerUrl ? (
        <View
          style={[
            styles.trailerContainer,
            {
              top: imageTop,
              width: screenWidth,
              height: billboardHeight,
            },
          ]}
          pointerEvents="none">
          <Video
            key={`native-video-${hero.id}-${hero.trailerUrl}`}
            source={{ uri: hero.trailerUrl }}
            style={styles.nativeVideo}
            resizeMode={ResizeMode.COVER}
            muted={isMuted}
            repeat={false}
            paused={!isActive || !showTrailer}
            playInBackground={false}
            playWhenInactive={false}
            ignoreSilentSwitch="ignore"
            onEnd={onTrailerEnded}
            onError={onTrailerEnded}
          />
        </View>
      ) : null}

      {/* 3. YouTube Fallback Trailer (via embedded WebView) */}
      {isActive && showTrailer && !hero.trailerUrl && hero.trailerKey ? (
        <View
          style={[
            styles.trailerContainer,
            {
              top: imageTop,
              width: screenWidth,
              height: billboardHeight,
            },
          ]}
          pointerEvents="none">
          <WebView
            ref={webViewRef}
            key={`trailer-yt-${hero.id}-${hero.trailerKey}`}
            source={{
              html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
                  <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; background: transparent; overflow: hidden; }
                    html, body {
                      width: 100%;
                      height: 100%;
                      background-color: #08090D;
                      overflow: hidden;
                      display: flex;
                      justify-content: center;
                      align-items: center;
                    }
                    #player {
                      position: absolute;
                      top: 50%;
                      left: 50%;
                      width: 100vw;
                      height: 100vh;
                      min-width: 100%;
                      min-height: 100%;
                      transform: translate(-50%, -50%) scale(1.38);
                      transform-origin: center center;
                      pointer-events: none;
                    }
                  </style>
                </head>
                <body>
                  <div id="player"></div>
                  <script>
                    var tag = document.createElement('script');
                    tag.src = "https://www.youtube.com/iframe_api";
                    var firstScriptTag = document.getElementsByTagName('script')[0];
                    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

                    function onYouTubeIframeAPIReady() {
                      window.__ytPlayer = new YT.Player('player', {
                        height: '100%',
                        width: '100%',
                        videoId: '${hero.trailerKey}',
                        playerVars: {
                          'autoplay': 1,
                          'mute': ${isMuted ? 1 : 0},
                          'controls': 0,
                          'showinfo': 0,
                          'rel': 0,
                          'loop': 0,
                          'modestbranding': 1,
                          'playsinline': 1,
                          'iv_load_policy': 3,
                          'disablekb': 1,
                          'fs': 0,
                          'origin': 'https://www.themoviedb.org'
                        },
                        events: {
                          'onReady': function(e) {
                            if (${isMuted}) {
                              e.target.mute();
                            } else {
                              e.target.unMute();
                              e.target.setVolume(100);
                            }
                            e.target.playVideo();
                          },
                          'onStateChange': function(e) {
                            if (e.data === 0) {
                              if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'ended' }));
                            }
                          },
                          'onError': function(e) {
                            if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'error' }));
                          }
                        }
                      });
                    }
                  </script>
                </body>
                </html>
              `,
            }}
            style={styles.webView}
            originWhitelist={['*']}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            mediaPlaybackRequiresUserAction={false}
            allowsInlineMediaPlayback={true}
            pointerEvents="none"
            onMessage={handleWebViewMessage}
            onError={() => {
              setShowTrailer(false);
              onTrailerEnded();
            }}
          />
        </View>
      ) : null}

      {/* 4. Top Vignette for Navbar */}
      <BillboardTopVignette height={imageTop + 80} />

      {/* 5. Left-to-right Side Vignette on Wide / TV screens */}
      {isWide && <BillboardSideOverlay width={Math.min(screenWidth * 0.55, 520)} />}

      {/* 6. Ultra-smooth 24-step Bottom Cinematic Faded Gradient */}
      <BillboardFadedOverlay height={fadeHeight} />

      {/* 7. Minimalist Widescreen Content Overlay (Clean & without buttons) */}
      <View
        style={[
          styles.content,
          isWide && styles.contentWide,
        ]}>
        {/* Title Logo Artwork or Bold Typography */}
        {hero.titleLogo && !failedLogo ? (
          <Image
            source={{ uri: hero.titleLogo }}
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

        {/* Prime Video Meta Badges Row */}
        <View style={styles.metaRow}>
          {hero.rating > 0 && (
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingStar}>★</Text>
              <Text style={styles.ratingText}>{hero.rating.toFixed(1)}</Text>
            </View>
          )}

          {hero.year && hero.year !== 'N/A' && (
            <Text style={styles.metaText}>{hero.year}</Text>
          )}

          <View style={styles.qualityPill}>
            <Text style={styles.qualityText}>4K UHD</Text>
          </View>

          <View style={styles.qualityPill}>
            <Text style={styles.qualityText}>HDR</Text>
          </View>

          <View style={styles.agePill}>
            <Text style={styles.ageText}>16+</Text>
          </View>

          <Text style={styles.metaText}>Audio • Subs</Text>
        </View>

        {/* Genres Row */}
        {hero.genres.length > 0 && (
          <Text
            style={[styles.genres, isWide && styles.genresWide]}
            numberOfLines={1}>
            {hero.genres.join('  •  ')}
          </Text>
        )}
      </View>
    </TVFocusable>
  );
});

export const HomeBillboard = memo(function HomeBillboardComponent({
  heroes,
  topInset,
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
  // If the active item has NO trailer, auto-advance after 7s.
  // If it HAS a trailer, it will auto-advance on trailer end, with a 75s fallback safety timer.
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
  const navbarHeight = isWide ? 0 : topInset + 48;
  const billboardHeight = isWide
    ? Math.round(Math.min(screenHeight * 0.74, 480))
    : Math.round(screenWidth * (9 / 16));

  const billboardTotalHeight = isWide ? billboardHeight : billboardHeight + navbarHeight;
  const fadeHeight = Math.round(billboardHeight * (isWide ? 0.74 : 0.82));
  const imageTop = isWide ? 0 : navbarHeight;

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
            />
          ))}
        </ScrollView>

        {/* Top Right Corner Mute/Unmute Trailer Button (Default Muted) */}
        <View
          style={[
            styles.muteButtonWrap,
            {
              top: imageTop + (isWide ? 14 : 8),
              right: isWide ? 28 : 12,
            },
          ]}
          pointerEvents="box-none">
          <TVFocusable
            style={[styles.muteGlassBtn, isTV && styles.muteGlassBtnTV]}
            focusedStyle={styles.muteGlassBtnFocused}
            activeOpacity={0.7}
            onPress={handleToggleMute}>
            {isMuted ? (
              <VolumeMuteIcon color="#FFFFFF" size={isTV ? 20 : 16} />
            ) : (
              <VolumeIcon color="#4ADE80" size={isTV ? 20 : 16} />
            )}
          </TVFocusable>
        </View>
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
    backgroundColor: '#08090D',
  },
  container: {
    position: 'relative',
    backgroundColor: '#08090D',
  },
  slide: {
    position: 'relative',
    justifyContent: 'flex-end',
  },
  slideFocused: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  backdropImage: {
    position: 'absolute',
    left: 0,
  },
  trailerContainer: {
    position: 'absolute',
    left: 0,
    overflow: 'hidden',
    backgroundColor: '#08090D',
  },
  nativeVideo: {
    width: '100%',
    height: '100%',
    backgroundColor: '#08090D',
  },
  webView: {
    width: '100%',
    height: '100%',
    backgroundColor: '#08090D',
    opacity: 0.99,
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 6,
    justifyContent: 'flex-end',
    pointerEvents: 'none',
  },
  contentWide: {
    paddingHorizontal: 40,
    paddingBottom: 14,
    maxWidth: 640,
  },
  titleLogo: {
    width: 180,
    height: 46,
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  titleLogoWide: {
    width: 340,
    height: 82,
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  titleWide: {
    fontSize: 34,
    lineHeight: 40,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 3,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  ratingStar: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '900',
  },
  ratingText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '800',
  },
  metaText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  qualityPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  qualityText: {
    color: '#E2E8F0',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  agePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  ageText: {
    color: '#E2E8F0',
    fontSize: 9,
    fontWeight: '800',
  },
  genres: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
    marginBottom: 8,
  },
  genresWide: {
    fontSize: 13,
    marginBottom: 10,
  },
  overview: {
    color: '#CBD5E1',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '400',
    marginBottom: 8,
  },
  overviewWide: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 10,
    maxWidth: 520,
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
  muteButtonWrap: {
    position: 'absolute',
    zIndex: 50,
  },
  muteGlassBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  muteGlassBtnTV: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  muteGlassBtnFocused: {
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    transform: [{ scale: 1.1 }],
  },
});
