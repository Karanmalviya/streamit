import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  ActivityIndicator,
  StyleSheet,
  BackHandler,
  StatusBar,
  Platform,
  Share,
  Animated,
} from 'react-native';
import Video, { ResizeMode, ViewType } from 'react-native-video';
import {
  MediaItem,
  TVSeason,
  TVEpisode,
  NetworkOrProvider,
  CastMember,
  MediaExtendedDetails,
  fetchTVSeasons,
  fetchTVEpisodes,
  fetchMediaNetworks,
  fetchMediaTrailer,
  fetchMediaLogo,
  fetchSimilarMedia,
  fetchMediaCredits,
  fetchMediaExtendedDetails,
} from '../services/tmdb';
import {
  PlayIcon,
  PlusIcon,
  CheckIcon,
  VolumeIcon,
  VolumeMuteIcon,
  BackIcon,
  ShareIcon,
  UpcomingIcon,
} from '../components/common/Icons';
import {
  BillboardFadedOverlay,
  BillboardTopVignette,
  BillboardSideOverlay,
} from '../components/common/FadedOverlay';
import { TVFocusable } from '../components/common/TVFocusable';
import { useDeviceMode } from '../hooks/useDeviceMode';
import { tvNavigation } from '../services/tvNavigation';

export interface DetailScreenProps {
  media: MediaItem;
  topInset: number;
  bottomInset: number;
  onBack: () => void;
  onPlay: (item: MediaItem, season?: number, episode?: number) => void;
  onToggleWatchlist: (item: MediaItem) => void;
  isInWatchlist: boolean;
  onSelectMedia?: (item: MediaItem) => void;
}

export function DetailScreen({
  media: initialMedia,
  topInset,
  bottomInset,
  onBack,
  onPlay,
  onToggleWatchlist,
  isInWatchlist,
  onSelectMedia,
}: DetailScreenProps) {
  const { isTV, isLandscape, width, height } = useDeviceMode();
  const isWide = isTV || isLandscape || width >= 768;

  // Active media displayed inside details page (updates when user taps related items)
  const [currentMedia, setCurrentMedia] = useState<MediaItem>(initialMedia);

  // Focus refs for TV remote navigation
  const backBtnRef = useRef<any>(null);
  const watchNowBtnRef = useRef<any>(null);
  const upcomingBtnRef = useRef<any>(null);
  const watchlistBtnRef = useRef<any>(null);
  const shareBtnRef = useRef<any>(null);
  const muteBtnRef = useRef<any>(null);
  const firstSeasonTabRef = useRef<any>(null);
  const firstEpisodeCardRef = useRef<any>(null);
  const firstRelatedCardRef = useRef<any>(null);
  const portraitPlayBtnRef = useRef<any>(null);
  const portraitUpcomingBtnRef = useRef<any>(null);
  const portraitWatchlistBtnRef = useRef<any>(null);
  const portraitShareBtnRef = useRef<any>(null);

  // Section position tracking for programmatic smooth scrolling on TV focus
  const sectionPositions = useRef({
    header: 0,
    seasons: 0,
    episodes: 0,
    related: 0,
  });

  // Hardware Back key handler for TV remote and mobile back button
  useEffect(() => {
    const handleBack = () => {
      onBack();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', handleBack);
    return () => sub.remove();
  }, [onBack]);

  // Sync initialMedia from props
  useEffect(() => {
    setCurrentMedia(initialMedia);
  }, [initialMedia]);

  // Scroll ref to reset to top on media change
  const scrollRef = useRef<any>(null);

  // Helper to scroll smoothly to a section on TV navigation
  const scrollToSection = useCallback((section: 'header' | 'seasons' | 'episodes' | 'related') => {
    if (!scrollRef.current) return;
    const y = sectionPositions.current[section] || 0;
    scrollRef.current.scrollTo({
      y: Math.max(0, y - (section === 'episodes' ? 100 : 40)),
      animated: true,
    });
  }, []);

  // Helper to scroll to a specific episode card
  const handleEpisodeFocus = useCallback((index: number) => {
    if (!scrollRef.current) return;
    const baseY = sectionPositions.current.episodes || sectionPositions.current.seasons || 300;
    const rowHeight = 84;
    const targetY = isWide ? baseY + Math.floor(index / 2) * rowHeight : baseY + index * rowHeight;
    scrollRef.current.scrollTo({
      y: Math.max(0, targetY - 120),
      animated: true,
    });
  }, [isWide]);

  // Trailer & Media Assets State
  const [trailerUrl, setTrailerUrl] = useState<string | null>(null);
  const [titleLogo, setTitleLogo] = useState<string | null>(null);
  const [failedLogo, setFailedLogo] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isBannerInView, setIsBannerInView] = useState(true);
  const [showStickyNav, setShowStickyNav] = useState(false);
  const navAnim = useRef(new Animated.Value(0)).current;

  // Networks & Production Companies
  const [networks, setNetworks] = useState<NetworkOrProvider[]>([]);
  const [failedNetworkLogos, setFailedNetworkLogos] = useState<Record<number, boolean>>({});

  // Extended Details & Credits State
  const [cast, setCast] = useState<CastMember[]>([]);
  const [extendedDetails, setExtendedDetails] = useState<MediaExtendedDetails | null>(null);

  // TV Seasons & Episodes
  const [seasons, setSeasons] = useState<TVSeason[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [episodes, setEpisodes] = useState<TVEpisode[]>([]);
  const [loadingSeasons, setLoadingSeasons] = useState<boolean>(false);
  const [loadingEpisodes, setLoadingEpisodes] = useState<boolean>(false);

  // Related Content
  const [similarMedia, setSimilarMedia] = useState<MediaItem[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState<boolean>(false);

  // Full-bleed 16:9 banner with clean status bar clearance
  const isLandscapeMode = isLandscape || isTV;
  const safeStatusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0;
  const effectiveTopInset = isTV ? 12 : Math.max(topInset || 0, safeStatusBarHeight, 32) + 6;
  const bannerHeight = isLandscapeMode
    ? Math.round(Math.min(height * 0.82, 580))
    : Math.round(width * (9 / 16));

  const imageTop = isLandscapeMode ? 0 : effectiveTopInset;
  const headerTotalHeight = bannerHeight + imageTop;
  const fadeHeight = Math.round(bannerHeight * (isLandscapeMode ? 0.80 : 0.75));

  // Handle Android Hardware Back Button
  useEffect(() => {
    const onBackPress = () => {
      onBack();
      return true;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [onBack]);

  // Fetch Trailer, Logo, Networks, Similar items, Credits, Extended Details when currentMedia changes
  useEffect(() => {
    if (!currentMedia) return;

    // Scroll to top
    if (scrollRef.current && scrollRef.current.scrollTo) {
      scrollRef.current.scrollTo({ y: 0, animated: false });
    }

    let isMounted = true;
    setShowTrailer(false);
    setFailedLogo(false);
    setIsBannerInView(true);
    setShowStickyNav(false);
    navAnim.setValue(0);

    // 1. Trailer fetch & 2s delay timer
    if (currentMedia.trailerUrl) {
      setTrailerUrl(currentMedia.trailerUrl);
    } else {
      fetchMediaTrailer(currentMedia.id, currentMedia.type)
        .then(tData => {
          if (isMounted && tData?.url) {
            setTrailerUrl(tData.url);
          }
        })
        .catch(() => { });
    }

    // 2. Logo fetch
    if (currentMedia.titleLogo) {
      setTitleLogo(currentMedia.titleLogo);
    } else {
      fetchMediaLogo(currentMedia.id, currentMedia.type)
        .then(logo => {
          if (isMounted) setTitleLogo(logo);
        })
        .catch(() => { });
    }

    // 3. Networks fetch
    fetchMediaNetworks(currentMedia.id, currentMedia.type)
      .then(res => {
        if (isMounted) setNetworks(res);
      })
      .catch(() => { });

    // 4. Credits (Cast & Crew) fetch
    fetchMediaCredits(currentMedia.id, currentMedia.type)
      .then(cData => {
        if (isMounted) {
          setCast(cData.cast);
        }
      })
      .catch(() => { });

    // 5. Extended Details (Advisories, Runtime, Release Date, Budget) fetch
    fetchMediaExtendedDetails(currentMedia.id, currentMedia.type)
      .then(extData => {
        if (isMounted) {
          setExtendedDetails(extData);
        }
      })
      .catch(() => { });

    // 6. Similar / Related Content fetch
    setLoadingSimilar(true);
    fetchSimilarMedia(currentMedia.id, currentMedia.type)
      .then(res => {
        if (isMounted) {
          setSimilarMedia(res.filter(i => i.id !== currentMedia.id));
          setLoadingSimilar(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoadingSimilar(false);
      });

    // 7. 2-Second Delay Timer for Trailer Autoplay
    const timer = setTimeout(() => {
      if (isMounted) {
        setShowTrailer(true);
      }
    }, 2000);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [currentMedia, navAnim]);

  // Fetch Seasons for TV series / Anime
  useEffect(() => {
    if (!currentMedia || currentMedia.type !== 'tv') {
      setSeasons([]);
      setEpisodes([]);
      return;
    }

    let isMounted = true;
    setLoadingSeasons(true);
    fetchTVSeasons(currentMedia.id)
      .then(res => {
        if (isMounted) {
          setSeasons(res);
          const firstSeason = res.length > 0 ? res[0].seasonNumber : 1;
          setSelectedSeason(firstSeason);
          setLoadingSeasons(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoadingSeasons(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentMedia]);

  // Fetch Episodes when selected season changes
  useEffect(() => {
    if (!currentMedia || currentMedia.type !== 'tv' || !selectedSeason) return;

    let isMounted = true;
    setLoadingEpisodes(true);
    fetchTVEpisodes(currentMedia.id, selectedSeason)
      .then(res => {
        if (isMounted) {
          setEpisodes(res);
          setLoadingEpisodes(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoadingEpisodes(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentMedia, selectedSeason]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  const handleTrailerEnded = useCallback(() => {
    setShowTrailer(false);
  }, []);

  const handleScroll = useCallback(
    (e: any) => {
      const scrollY = e.nativeEvent?.contentOffset?.y ?? 0;
      // Pause video when user scrolls down past 60% of the trailer banner
      const inView = scrollY < bannerHeight * 0.6;
      setIsBannerInView(prev => (prev !== inView ? inView : prev));

      // Show sticky navbar with movie name when scrolled down past the banner
      const shouldShowNav = scrollY > (bannerHeight - 40);
      setShowStickyNav(prev => {
        if (prev !== shouldShowNav) {
          Animated.timing(navAnim, {
            toValue: shouldShowNav ? 1 : 0,
            duration: 180,
            useNativeDriver: true,
          }).start();
          return shouldShowNav;
        }
        return prev;
      });
    },
    [bannerHeight, navAnim],
  );

  const handleShare = useCallback(async () => {
    try {
      const title = currentMedia.title;
      const year = currentMedia.year ? ` (${currentMedia.year})` : '';
      await Share.share({
        title: `${title}${year}`,
        message: `Watch ${title}${year} on Streamit!\n${currentMedia.overview || ''}`.trim(),
      });
    } catch {
      // Ignore cancellation
    }
  }, [currentMedia]);

  const handleSelectRelated = useCallback((item: MediaItem) => {
    setCurrentMedia(item);
    if (onSelectMedia) {
      onSelectMedia(item);
    }
  }, [onSelectMedia]);

  const backdropUri = currentMedia.backdrop || currentMedia.poster || undefined;
  const displayCertification = useMemo(() => {
    const raw = extendedDetails?.certification?.trim();
    if (!raw) return currentMedia.type === 'movie' ? 'U/A 13+' : 'U/A 16+';
    if (raw === '18+' || raw === 'A' || raw === 'R' || raw === 'TV-MA' || raw === 'NC-17') return 'U/A 18+';
    if (raw === '16+' || raw === 'TV-14' || raw === '15') return 'U/A 16+';
    if (raw === '13+' || raw === 'PG-13' || raw === '12') return 'U/A 13+';
    if (raw === 'U' || raw === 'G' || raw === 'TV-G' || raw === 'TV-Y' || raw === 'PG') return 'U';
    return raw.startsWith('U/A') ? raw : `U/A ${raw}`;
  }, [extendedDetails?.certification, currentMedia.type]);

  const displayRuntime = extendedDetails?.runtimeFormatted;

  const displayLanguages = useMemo(() => {
    if (extendedDetails?.spokenLanguages && extendedDetails.spokenLanguages.length > 0) {
      return extendedDetails.spokenLanguages.slice(0, 3).join(', ');
    }
    return currentMedia?.language || 'English';
  }, [extendedDetails?.spokenLanguages, currentMedia?.language]);

  const isUpcoming = useMemo(() => {
    if (extendedDetails?.isUpcoming !== undefined) {
      return extendedDetails.isUpcoming;
    }
    const status = (extendedDetails?.status || '').toLowerCase();
    if (['upcoming', 'in production', 'post production', 'planned', 'rumored'].includes(status)) {
      return true;
    }
    if (extendedDetails?.rawReleaseDate) {
      const releaseTime = new Date(extendedDetails.rawReleaseDate).getTime();
      if (!isNaN(releaseTime) && releaseTime > Date.now()) {
        return true;
      }
    }
    const currentYear = new Date().getFullYear();
    const mediaYear = parseInt(currentMedia.year, 10);
    if (!isNaN(mediaYear) && mediaYear > currentYear) {
      return true;
    }
    return false;
  }, [extendedDetails?.isUpcoming, extendedDetails?.status, extendedDetails?.rawReleaseDate, currentMedia.year]);

  const hasTrailer = Boolean(trailerUrl);

  const stickyNavPaddingTop = isWide
    ? 8
    : Platform.OS === 'android'
      ? (StatusBar.currentHeight || 24) + 4
      : Math.max(topInset || 0, 16);

  const handlePressUpToBackBtn = useCallback(() => {
    scrollToSection('header');
    backBtnRef.current?.focus?.();
  }, [scrollToSection]);

  const handlePressDownFromBackBtn = useCallback(() => {
    if (isLandscapeMode) {
      if (isUpcoming) {
        upcomingBtnRef.current?.focus?.();
      } else {
        watchNowBtnRef.current?.focus?.();
      }
    } else {
      if (isUpcoming) {
        portraitUpcomingBtnRef.current?.focus?.();
      } else {
        portraitPlayBtnRef.current?.focus?.();
      }
    }
  }, [isLandscapeMode, isUpcoming]);

  const handlePressDownToBody = useCallback(() => {
    if (currentMedia.type === 'tv') {
      if (seasons.length > 0 && firstSeasonTabRef.current?.focus) {
        scrollToSection('seasons');
        firstSeasonTabRef.current.focus();
        return;
      }
      if (episodes.length > 0 && firstEpisodeCardRef.current?.focus) {
        scrollToSection('episodes');
        firstEpisodeCardRef.current.focus();
        return;
      }
    }
    if (similarMedia.length > 0 && firstRelatedCardRef.current?.focus) {
      scrollToSection('related');
      firstRelatedCardRef.current.focus();
      return;
    }
  }, [currentMedia.type, seasons.length, episodes.length, similarMedia.length, scrollToSection]);

  // Initial focus on TV mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLandscapeMode) {
        if (isUpcoming) {
          upcomingBtnRef.current?.focus?.();
        } else {
          watchNowBtnRef.current?.focus?.();
        }
      } else {
        if (isUpcoming) {
          portraitUpcomingBtnRef.current?.focus?.();
        } else {
          portraitPlayBtnRef.current?.focus?.();
        }
      }
    }, 180);
    return () => clearTimeout(timer);
  }, [currentMedia.id, isLandscapeMode, isUpcoming]);

  return (
    <View style={styles.screenRoot}>
      {/* Top Navbar: Single stationary bar so back arrow never jumps/moves, with background & title fading in smoothly */}
      <View
        pointerEvents="box-none"
        style={[
          styles.stickyNavbar,
          {
            paddingTop: stickyNavPaddingTop,
          },
        ]}>
        {/* Animated Background & Bottom Border */}
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            styles.stickyNavbarBg,
            { opacity: navAnim },
          ]}
        />

        {/* Back Button: Stays in the exact same stationary position at all times */}
        <TVFocusable
          ref={backBtnRef}
          style={styles.roundControlBtn}
          focusedStyle={styles.roundControlBtnFocused}
          focusRingStyle={styles.roundControlBtnFocusRing}
          borderRadius={20}
          hasTVPreferredFocus={false}
          onPressLeft={() => tvNavigation.focusSidebar('home')}
          onPressDown={handlePressDownFromBackBtn}
          onPress={onBack}>
          <BackIcon color="#FFFFFF" size={24} />
        </TVFocusable>

        {/* Animated Movie Title: Fades in seamlessly on scroll */}
        <Animated.View
          style={[styles.stickyNavbarTitleWrap, { opacity: navAnim }]}
          pointerEvents={showStickyNav ? 'auto' : 'none'}>
          <Text style={styles.stickyNavbarTitle} numberOfLines={1}>
            {currentMedia.title}
          </Text>
        </Animated.View>

        {/* Spacer to keep title centered */}
        <View style={styles.stickyPlaceholder} />
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.containerScroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset + 80 }]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={32}
        overScrollMode="never"
        bounces={false}
        onScroll={handleScroll}>
        {/* 1. TOP HEADER: 16:9 Backdrop Image + 2s Autoplay Trailer Header Starting Below Navbar */}
        <View style={[styles.headerWrap, { width: '100%', height: headerTotalHeight }]}>
          {/* Backdrop Image (Immediate, starts strictly below top navbar) */}
          <Image
            source={{ uri: backdropUri }}
            style={[
              styles.backdropImage,
              {
                top: imageTop,
                width: '100%',
                height: bannerHeight,
              },
            ]}
            resizeMode="cover"
          />

          {/* Direct MP4 Native Video Trailer Stream */}
          {showTrailer && trailerUrl ? (
            <View
              style={[
                styles.trailerContainer,
                {
                  top: imageTop,
                  width: '100%',
                  height: bannerHeight,
                },
              ]}
              pointerEvents="none">
              <Video
                key={`detail-video-${currentMedia.id}-${trailerUrl}`}
                source={{ uri: trailerUrl }}
                style={styles.nativeVideo}
                resizeMode={ResizeMode.COVER}
                useTextureView={true}
                viewType={ViewType.TEXTURE}
                muted={isMuted}
                repeat={true}
                paused={!showTrailer || !isBannerInView}
                playInBackground={false}
                playWhenInactive={false}
                ignoreSilentSwitch="ignore"
                onError={handleTrailerEnded}
              />
            </View>
          ) : null}

          {/* Top Vignette (In Landscape / TV mode for clean contrast and status bar / back button visibility) */}
          {isLandscapeMode && <BillboardTopVignette height={70} />}

          {/* Left-to-Right Side Shadow Vignette (In Landscape / TV mode for high-contrast readable text) */}
          {isLandscapeMode && <BillboardSideOverlay width={Math.min(width * 0.6, 560)} />}

          {/* Bottom Lossless GPU Gradient Fade */}
          <View style={styles.bottomOverlayWrap} pointerEvents="none">
            <BillboardFadedOverlay height={fadeHeight} />
          </View>

          {/* LANDSCAPE BILLBOARD CONTENT OVERLAY (Inside banner, matching Homepage Billboard) */}
          {isLandscapeMode && (
            <View style={styles.billboardContent} pointerEvents="box-none">
              {/* Title Logo Artwork or Bold Typography */}
              {titleLogo && !failedLogo ? (
                <Image
                  source={{ uri: titleLogo }}
                  style={styles.billboardTitleLogo}
                  resizeMode="contain"
                  onError={() => setFailedLogo(true)}
                />
              ) : (
                <Text style={styles.billboardTitleText} numberOfLines={2}>
                  {currentMedia.title}
                </Text>
              )}

              {/* Metadata Badges Row: Year · U/A Certification · Runtime · Languages */}
              <View style={styles.billboardMetaRow}>
                {currentMedia.year && currentMedia.year !== 'N/A' && (
                  <Text style={styles.billboardMetaYear}>{currentMedia.year}</Text>
                )}
                <View style={styles.billboardMetaDot} />
                <View style={styles.billboardTagPill}>
                  <Text style={styles.billboardTagPillText}>{displayCertification}</Text>
                </View>
                {displayRuntime ? (
                  <>
                    <View style={styles.billboardMetaDot} />
                    <Text style={styles.billboardMetaRuntime}>{displayRuntime}</Text>
                  </>
                ) : null}
                {displayLanguages ? (
                  <>
                    <View style={styles.billboardMetaDot} />
                    <Text style={styles.billboardMetaLanguages} numberOfLines={1}>
                      {displayLanguages}
                    </Text>
                  </>
                ) : null}
              </View>

              {/* Action Buttons Row: Watch Now / Upcoming, Watchlist, Share */}
              <View style={styles.billboardActionRow}>
                {isUpcoming ? (
                  <TVFocusable
                    ref={upcomingBtnRef}
                    style={styles.billboardUpcomingBtn}
                    focusedStyle={styles.billboardUpcomingBtnFocused}
                    focusRingStyle={styles.billboardUpcomingFocusRing}
                    hasTVPreferredFocus={isLandscapeMode && isUpcoming}
                    borderRadius={8}
                    onPressLeft={() => tvNavigation.focusSidebar('home')}
                    onPressRight={() => watchlistBtnRef.current?.focus?.()}
                    onPressUp={handlePressUpToBackBtn}
                    onPressDown={handlePressDownToBody}
                    onPress={() => onToggleWatchlist(currentMedia)}>
                    <UpcomingIcon color="#F59E0B" size={16} />
                    <Text style={styles.billboardUpcomingText}>
                      {extendedDetails?.releaseDateFormatted ? `Upcoming • ${extendedDetails.releaseDateFormatted}` : 'Upcoming'}
                    </Text>
                  </TVFocusable>
                ) : (
                  <TVFocusable
                    ref={watchNowBtnRef}
                    style={styles.billboardWatchNowBtn}
                    focusedStyle={styles.billboardWatchNowBtnFocused}
                    focusRingStyle={styles.billboardWatchNowFocusRing}
                    hasTVPreferredFocus={isLandscapeMode && !isUpcoming}
                    borderRadius={8}
                    onPressLeft={() => tvNavigation.focusSidebar('home')}
                    onPressRight={() => watchlistBtnRef.current?.focus?.()}
                    onPressUp={handlePressUpToBackBtn}
                    onPressDown={handlePressDownToBody}
                    onPress={() => {
                      if (onPlay) {
                        onPlay(currentMedia, selectedSeason, 1);
                      }
                    }}>
                    <PlayIcon color="#000000" size={16} />
                    <Text style={styles.billboardWatchNowText}>
                      {currentMedia.type === 'tv' ? `Play S${selectedSeason} E1` : 'Watch Now'}
                    </Text>
                  </TVFocusable>
                )}

                <TVFocusable
                  ref={watchlistBtnRef}
                  style={[
                    styles.billboardActionPillBtn,
                    isInWatchlist && styles.billboardActionPillBtnActive,
                  ]}
                  focusedStyle={styles.billboardActionPillBtnFocused}
                  focusRingStyle={styles.pillFocusRing}
                  borderRadius={8}
                  onPressLeft={() => {
                    if (isUpcoming) {
                      upcomingBtnRef.current?.focus?.();
                    } else {
                      watchNowBtnRef.current?.focus?.();
                    }
                  }}
                  onPressRight={() => shareBtnRef.current?.focus?.()}
                  onPressUp={handlePressUpToBackBtn}
                  onPressDown={handlePressDownToBody}
                  onPress={() => onToggleWatchlist(currentMedia)}>
                  {isInWatchlist ? (
                    <CheckIcon color="#4ADE80" size={16} />
                  ) : (
                    <PlusIcon color="#FFFFFF" size={16} />
                  )}
                  <Text
                    style={[
                      styles.billboardActionPillText,
                      isInWatchlist && styles.billboardActionPillTextActive,
                    ]}>
                    {isInWatchlist ? 'In Watchlist' : 'Watchlist'}
                  </Text>
                </TVFocusable>

                <TVFocusable
                  ref={shareBtnRef}
                  style={styles.billboardActionPillBtn}
                  focusedStyle={styles.billboardActionPillBtnFocused}
                  focusRingStyle={styles.pillFocusRing}
                  borderRadius={8}
                  onPressLeft={() => watchlistBtnRef.current?.focus?.()}
                  onPressRight={() => {
                    if (hasTrailer && showTrailer && muteBtnRef.current?.focus) {
                      muteBtnRef.current.focus();
                    }
                  }}
                  onPressUp={handlePressUpToBackBtn}
                  onPressDown={handlePressDownToBody}
                  onPress={handleShare}>
                  <ShareIcon color="#FFFFFF" size={16} />
                  <Text style={styles.billboardActionPillText}>Share</Text>
                </TVFocusable>
              </View>
            </View>
          )}

          {/* Bottom Right Volume Mute / Unmute Button */}
          {hasTrailer && showTrailer ? (
            <View style={[styles.bannerMuteWrap, isLandscapeMode && styles.bannerMuteWrapLandscape]}>
              <TVFocusable
                ref={muteBtnRef}
                style={styles.bannerMuteBtn}
                focusedStyle={styles.bannerMuteBtnFocused}
                focusRingStyle={styles.muteBtnFocusRing}
                borderRadius={6}
                onPressLeft={() => shareBtnRef.current?.focus?.()}
                onPressUp={handlePressUpToBackBtn}
                onPressDown={handlePressDownToBody}
                onPress={toggleMute}>
                {isMuted ? (
                  <VolumeMuteIcon color="#FFFFFF" size={22} />
                ) : (
                  <VolumeIcon color="#FFFFFF" size={22} />
                )}
              </TVFocusable>
            </View>
          ) : null}
        </View>

        {/* 2. BODY CONTENT SECTION */}
        <View style={[styles.bodyContent, isLandscapeMode ? styles.bodyContentLandscape : (isWide && styles.bodyContentWide)]}>
          {/* Portrait-Only Header Content (Title, Metadata, and Play Action Button) */}
          {!isLandscapeMode && (
            <>
              {/* Title / Movie or Series Image Artwork (Centered Cleanly Below Backdrop) */}
              <View style={styles.titleLogoWrap}>
                {titleLogo && !failedLogo ? (
                  <Image
                    source={{ uri: titleLogo }}
                    style={[styles.titleLogoImg, isWide && styles.titleLogoImgWide]}
                    resizeMode="contain"
                    onError={() => setFailedLogo(true)}
                  />
                ) : (
                  <Text style={[styles.titleTextHeading, isWide && styles.titleTextHeadingWide]} numberOfLines={2}>
                    {currentMedia.title}
                  </Text>
                )}
              </View>

              {/* Meta Tags Row: Year, U/A 18+ Certification, Duration, Languages, Quality */}
              <View style={styles.metaRow}>
                <Text style={styles.metaYear}>{currentMedia.year}</Text>
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

              {/* Action Buttons Row: Full Width Watch Now / Upcoming */}
              <View style={styles.actionRow}>
                {isUpcoming ? (
                  <TVFocusable
                    ref={portraitUpcomingBtnRef}
                    style={styles.primaryUpcomingBtnFull}
                    focusedStyle={styles.primaryUpcomingBtnFullFocused}
                    focusRingStyle={styles.billboardUpcomingFocusRing}
                    hasTVPreferredFocus={!isLandscapeMode && isUpcoming}
                    borderRadius={8}
                    onPressUp={handlePressUpToBackBtn}
                    onPressDown={() => portraitWatchlistBtnRef.current?.focus?.()}
                    onPress={() => onToggleWatchlist(currentMedia)}>
                    <UpcomingIcon color="#F59E0B" size={18} />
                    <Text style={styles.primaryUpcomingText}>
                      {extendedDetails?.releaseDateFormatted ? `Upcoming (${extendedDetails.releaseDateFormatted})` : 'Upcoming'}
                    </Text>
                  </TVFocusable>
                ) : (
                  <TVFocusable
                    ref={portraitPlayBtnRef}
                    style={styles.primaryPlayBtnFull}
                    focusedStyle={styles.primaryPlayBtnFullFocused}
                    focusRingStyle={styles.billboardWatchNowFocusRing}
                    hasTVPreferredFocus={!isLandscapeMode && !isUpcoming}
                    borderRadius={8}
                    onPressUp={handlePressUpToBackBtn}
                    onPressDown={() => portraitWatchlistBtnRef.current?.focus?.()}
                    onPress={() => {
                      if (onPlay) {
                        onPlay(currentMedia, selectedSeason, 1);
                      }
                    }}>
                    <PlayIcon color="#000000" size={18} />
                    <Text style={styles.primaryPlayText}>
                      {currentMedia.type === 'tv' ? `Play S${selectedSeason} E1` : 'Watch Now'}
                    </Text>
                  </TVFocusable>
                )}
              </View>
            </>
          )}

          {/* Storyline / Overview with Genres as heading separated by pipe */}
          <View style={styles.sectionBlock}>
            {currentMedia.genres.length > 0 && (
              <Text style={styles.genreHeadingText} numberOfLines={2}>
                {currentMedia.genres.join('  |  ')}
              </Text>
            )}
            <Text style={styles.overviewText}>
              {currentMedia.overview || 'No description available for this title.'}
            </Text>
          </View>

          {/* Portrait-Only Below Storyline Actions: Watchlist & Share */}
          {!isLandscapeMode && (
            <View style={styles.secondaryActionsRow}>
              <TVFocusable
                ref={portraitWatchlistBtnRef}
                style={[
                  styles.actionPillBtn,
                  isInWatchlist && styles.actionPillBtnActive,
                ]}
                focusedStyle={styles.actionPillBtnFocused}
                focusRingStyle={styles.pillFocusRing}
                borderRadius={8}
                onPressUp={() => {
                  if (isUpcoming) {
                    portraitUpcomingBtnRef.current?.focus?.();
                  } else {
                    portraitPlayBtnRef.current?.focus?.();
                  }
                }}
                onPressRight={() => portraitShareBtnRef.current?.focus?.()}
                onPressDown={handlePressDownToBody}
                onPress={() => onToggleWatchlist(currentMedia)}>
                {isInWatchlist ? (
                  <CheckIcon color="#4ADE80" size={18} />
                ) : (
                  <PlusIcon color="#FFFFFF" size={18} />
                )}
                <Text
                  style={[
                    styles.actionPillText,
                    isInWatchlist && styles.actionPillTextActive,
                  ]}>
                  {isInWatchlist ? 'In Watchlist' : 'Watchlist'}
                </Text>
              </TVFocusable>

              <TVFocusable
                ref={portraitShareBtnRef}
                style={styles.actionPillBtn}
                focusedStyle={styles.actionPillBtnFocused}
                focusRingStyle={styles.pillFocusRing}
                borderRadius={8}
                onPressLeft={() => portraitWatchlistBtnRef.current?.focus?.()}
                onPressUp={() => {
                  if (isUpcoming) {
                    portraitUpcomingBtnRef.current?.focus?.();
                  } else {
                    portraitPlayBtnRef.current?.focus?.();
                  }
                }}
                onPressDown={handlePressDownToBody}
                onPress={handleShare}>
                <ShareIcon color="#FFFFFF" size={18} />
                <Text style={styles.actionPillText}>Share</Text>
              </TVFocusable>
            </View>
          )}

          {/* Content Advisory: Sleek Modern Inline Bar */}
          {extendedDetails?.contentAdvisories && extendedDetails.contentAdvisories.length > 0 && (
            <View style={styles.advisoryRow}>
              <View style={styles.advisoryBadge}>
                <Text style={styles.advisoryBadgeText}>{displayCertification}</Text>
              </View>
              <Text style={styles.advisoryText} numberOfLines={2}>
                {extendedDetails.contentAdvisories.join('  •  ')}
              </Text>
            </View>
          )}

          {/* Cast Horizontal Rail */}
          {cast.length > 0 && (
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeading}>CAST</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.castScroll}>
                {cast.map(c => (
                  <View key={'cast-' + c.id + '-' + c.character} style={styles.castCard}>
                    <View style={styles.castAvatarWrap}>
                      {c.profile ? (
                        <Image
                          source={{ uri: c.profile }}
                          style={styles.castAvatarImg}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.castAvatarFallback}>
                          <Text style={styles.castAvatarInitials}>
                            {c.name.substring(0, 1)}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.castActorName} numberOfLines={1}>
                      {c.name}
                    </Text>
                    <Text style={styles.castRoleName} numberOfLines={1}>
                      {c.character}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Studios & Networks Logos Row */}
          {networks.length > 0 && (
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeading}>STUDIO & NETWORK</Text>
              <View style={styles.networksRow}>
                {networks.map(n => {
                  const hasError = failedNetworkLogos[n.id];
                  return (
                    <View key={'net-' + n.id} style={styles.networkBadge}>
                      {n.logo && !hasError ? (
                        <Image
                          source={{ uri: n.logo }}
                          style={styles.networkLogoImg}
                          resizeMode="contain"
                          onError={() => {
                            setFailedNetworkLogos(prev => ({ ...prev, [n.id]: true }));
                          }}
                        />
                      ) : (
                        <Text style={styles.networkBadgeText}>{n.name}</Text>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* 3. TV SERIES: SEASONS & EPISODES PICKER */}
          {currentMedia.type === 'tv' && (
            <View
              style={styles.sectionBlock}
              onLayout={e => {
                sectionPositions.current.seasons = e.nativeEvent.layout.y;
              }}>
              <Text style={styles.sectionHeading}>SEASONS & EPISODES</Text>

              {loadingSeasons ? (
                <ActivityIndicator size="small" color="#FFFFFF" style={styles.indicatorMargin} />
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.seasonScroll}>
                  {seasons.map((s, idx) => {
                    const isActive = s.seasonNumber === selectedSeason;
                    return (
                      <TVFocusable
                        key={s.id}
                        ref={idx === 0 ? firstSeasonTabRef : undefined}
                        style={[styles.seasonTab, isActive && styles.seasonTabActive]}
                        focusedStyle={isActive ? styles.seasonTabActiveFocused : styles.seasonTabFocused}
                        focusRingStyle={isActive ? styles.seasonTabActiveFocusRing : styles.seasonTabFocusRing}
                        borderRadius={6}
                        onFocus={() => scrollToSection('seasons')}
                        onPressLeft={idx === 0 ? () => tvNavigation.focusSidebar('home') : undefined}
                        onPressUp={() => {
                          scrollToSection('header');
                          if (isLandscapeMode) {
                            if (isUpcoming) {
                              upcomingBtnRef.current?.focus?.();
                            } else {
                              watchNowBtnRef.current?.focus?.();
                            }
                          } else {
                            if (isUpcoming) {
                              portraitUpcomingBtnRef.current?.focus?.();
                            } else {
                              portraitPlayBtnRef.current?.focus?.();
                            }
                          }
                        }}
                        onPressDown={() => {
                          scrollToSection('episodes');
                          firstEpisodeCardRef.current?.focus?.();
                        }}
                        onPress={() => setSelectedSeason(s.seasonNumber)}>
                        <Text
                          style={[
                            styles.seasonTabText,
                            isActive && styles.seasonTabTextActive,
                          ]}>
                          {s.name || `Season ${s.seasonNumber}`}
                        </Text>
                        <Text
                          style={[
                            styles.seasonTabEpCount,
                            isActive && styles.seasonTabEpCountActive,
                          ]}>
                          {s.episodeCount} eps
                        </Text>
                      </TVFocusable>
                    );
                  })}
                </ScrollView>
              )}

              {loadingEpisodes ? (
                <ActivityIndicator size="small" color="#FFFFFF" style={styles.indicatorMargin} />
              ) : (
                <View
                  style={[styles.episodeList, isWide && styles.episodeListWide]}
                  onLayout={e => {
                    sectionPositions.current.episodes =
                      sectionPositions.current.seasons + e.nativeEvent.layout.y;
                  }}>
                  {episodes.map((ep, epIdx) => (
                    <TVFocusable
                      key={ep.id}
                      ref={epIdx === 0 ? firstEpisodeCardRef : undefined}
                      style={[styles.episodeCard, isWide && styles.episodeCardWide]}
                      focusedStyle={styles.episodeCardFocused}
                      focusRingStyle={styles.episodeCardFocusRing}
                      borderRadius={8}
                      onFocus={() => handleEpisodeFocus(epIdx)}
                      onPressLeft={epIdx % (isWide ? 2 : 1) === 0 ? () => tvNavigation.focusSidebar('home') : undefined}
                      onPressUp={
                        epIdx === 0 || (isWide && epIdx === 1)
                          ? () => {
                              scrollToSection('seasons');
                              firstSeasonTabRef.current?.focus?.();
                            }
                          : undefined
                      }
                      onPressDown={
                        epIdx === episodes.length - 1 || (isWide && epIdx === episodes.length - 2)
                          ? () => {
                              scrollToSection('related');
                              firstRelatedCardRef.current?.focus?.();
                            }
                          : undefined
                      }
                      onPress={() => {
                        if (onPlay) {
                          onPlay(currentMedia, selectedSeason, ep.episodeNumber);
                        }
                      }}>
                      <View style={styles.epThumbWrap}>
                        {ep.still ? (
                          <Image
                            source={{ uri: ep.still }}
                            style={styles.epThumbImg}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={styles.epThumbPlaceholder}>
                            <PlayIcon color="#555C70" size={18} />
                          </View>
                        )}
                        <View style={styles.epPlayBadge}>
                          <PlayIcon color="#FFFFFF" size={10} />
                        </View>
                        {ep.runtime ? (
                          <View style={styles.epRuntimeBadge}>
                            <Text style={styles.epRuntimeText}>{ep.runtime}m</Text>
                          </View>
                        ) : null}
                      </View>

                      <View style={styles.epInfoWrap}>
                        <Text style={styles.epTitleText} numberOfLines={1}>
                          E{ep.episodeNumber} • {ep.name || `Episode ${ep.episodeNumber}`}
                        </Text>
                        {ep.overview ? (
                          <Text style={styles.epOverviewText} numberOfLines={2}>
                            {ep.overview}
                          </Text>
                        ) : null}
                      </View>
                    </TVFocusable>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* 4. RELATED CONTENT / MORE LIKE THIS RAIL */}
          <View
            style={styles.sectionBlock}
            onLayout={e => {
              sectionPositions.current.related = e.nativeEvent.layout.y;
            }}>
            <Text style={styles.sectionHeading}>MORE LIKE THIS</Text>

            {loadingSimilar ? (
              <ActivityIndicator size="small" color="#FFFFFF" style={styles.indicatorMargin} />
            ) : similarMedia.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.relatedScroll}>
                {similarMedia.map((item, relIdx) => (
                  <TVFocusable
                    key={item.id}
                    ref={relIdx === 0 ? firstRelatedCardRef : undefined}
                    style={styles.relatedCard}
                    focusedStyle={styles.relatedCardFocused}
                    focusRingStyle={styles.relatedCardFocusRing}
                    borderRadius={6}
                    onFocus={() => scrollToSection('related')}
                    onPressLeft={relIdx === 0 ? () => tvNavigation.focusSidebar('home') : undefined}
                    onPressUp={() => {
                      if (currentMedia.type === 'tv' && episodes.length > 0) {
                        scrollToSection('episodes');
                        firstEpisodeCardRef.current?.focus?.();
                      } else {
                        scrollToSection('header');
                        if (isLandscapeMode) {
                          if (isUpcoming) {
                            upcomingBtnRef.current?.focus?.();
                          } else {
                            watchNowBtnRef.current?.focus?.();
                          }
                        } else {
                          if (isUpcoming) {
                            portraitUpcomingBtnRef.current?.focus?.();
                          } else {
                            portraitPlayBtnRef.current?.focus?.();
                          }
                        }
                      }
                    }}
                    onPress={() => handleSelectRelated(item)}>
                    <Image
                      source={{ uri: item.poster || item.backdrop || undefined }}
                      style={styles.relatedPoster}
                      resizeMode="cover"
                    />
                    <View style={styles.relatedRatingBadge}>
                      <Text style={styles.relatedRatingText}>★ {item.rating.toFixed(1)}</Text>
                    </View>
                    <Text style={styles.relatedTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.relatedYear}>{item.year}</Text>
                  </TVFocusable>
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.noSimilarText}>No related titles available.</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
    backgroundColor: '#040406',
  },
  floatingBackWrap: {
    position: 'absolute',
    left: 8,
    zIndex: 50,
  },
  stickyNavbar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 8,
    paddingRight: 14,
    paddingBottom: 6,
  },
  stickyNavbarBg: {
    backgroundColor: 'rgba(4, 4, 6, 0.98)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  stickyNavbarTitleWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  stickyNavbarTitle: {
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  stickyPlaceholder: {
    width: 36,
    height: 36,
  },
  topNavbar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 99,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: 'rgba(4, 4, 6, 0.96)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  topNavbarBrand: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandLogoSmall: {
    width: 110,
    height: 30,
  },
  navPlaceholderBtn: {
    width: 38,
    height: 38,
  },
  roundControlBtn: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 6,
  },
  containerScroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 56,
  },
  headerWrap: {
    position: 'relative',
    backgroundColor: '#040406',
    overflow: 'hidden',
  },
  backdropImage: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#040406',
  },
  trailerContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#040406',
    overflow: 'hidden',
  },
  nativeVideo: {
    width: '100%',
    height: '100%',
    transform: [{ scale: 1.34 }],
  },
  webView: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
  },
  bottomOverlayWrap: {
    position: 'absolute',
    bottom: -4,
    left: 0,
    right: 0,
  },
  bannerMuteWrap: {
    position: 'absolute',
    right: 16,
    bottom: 38,
    zIndex: 99,
    elevation: 10,
  },
  bannerMuteWrapWide: {
    right: 28,
    bottom: 48,
  },
  bannerMuteWrapLandscape: {
    right: 32,
    bottom: 30,
  },
  bannerMuteBtn: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 6,
  },
  bannerMuteBtnFocused: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    transform: [{ scale: 1.15 }],
    borderRadius: 6,
  },
  billboardContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 32,
    paddingBottom: 28,
    maxWidth: 720,
    justifyContent: 'flex-end',
    pointerEvents: 'box-none',
    zIndex: 10,
  },
  billboardTitleLogo: {
    width: 280,
    height: 72,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  billboardTitleText: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.3,
    marginBottom: 8,
    textAlign: 'left',
  },
  billboardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  billboardMetaYear: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
    marginRight: 2,
  },
  billboardMetaDot: {
    width: 3.5,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: '#64748B',
    marginHorizontal: 1,
  },
  billboardTagPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  billboardTagPillText: {
    color: '#CBD0DF',
    fontSize: 9,
    fontWeight: '800',
  },
  billboardMetaRuntime: {
    color: '#A0AEC0',
    fontSize: 12,
    fontWeight: '600',
    marginRight: 2,
  },
  billboardMetaLanguages: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
  },
  billboardActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  billboardWatchNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  billboardWatchNowText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '900',
  },
  billboardUpcomingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    gap: 8,
  },
  billboardUpcomingText: {
    color: '#FCD34D',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  billboardActionPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D0F16',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: '#191D2A',
  },
  billboardActionPillBtnActive: {
    borderColor: '#4ADE80',
    backgroundColor: 'rgba(74, 222, 128, 0.08)',
  },
  billboardActionPillText: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '700',
  },
  billboardActionPillTextActive: {
    color: '#4ADE80',
  },
  titleLogoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    marginTop: 0,
    width: '100%',
  },
  titleLogoImg: {
    width: 240,
    height: 70,
    alignSelf: 'center',
  },
  titleLogoImgWide: {
    width: 320,
    height: 90,
    alignSelf: 'center',
  },
  titleTextHeading: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  titleTextHeadingWide: {
    fontSize: 30,
    textAlign: 'center',
  },
  bodyContent: {
    paddingHorizontal: 16,
    paddingTop: 0,
    marginTop: -20,
    backgroundColor: '#040406',
  },
  bodyContentWide: {
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    marginTop: -30,
    backgroundColor: '#040406',
  },
  bodyContentLandscape: {
    width: '100%',
    maxWidth: '100%',
    paddingHorizontal: 32,
    paddingTop: 8,
    marginTop: 0,
    backgroundColor: '#040406',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  metaDot: {
    width: 3.5,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: '#64748B',
    marginHorizontal: 1,
  },
  metaLanguages: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
  },
  ratingBadge: {
    backgroundColor: '#11141E',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  ratingText: {
    color: '#F4C042',
    fontSize: 12,
    fontWeight: '800',
  },
  metaYear: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
    marginRight: 2,
  },
  metaRuntime: {
    color: '#A0AEC0',
    fontSize: 12,
    fontWeight: '600',
    marginRight: 2,
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
  typeBadge: {
    backgroundColor: '#1A2136',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  typeBadgeText: {
    color: '#60A5FA',
    fontSize: 9,
    fontWeight: '900',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 16,
  },
  primaryPlayBtnFull: {
    flex: 1,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 13,
    borderRadius: 8,
    gap: 8,
  },
  primaryUpcomingBtnFull: {
    flex: 1,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    paddingVertical: 13,
    borderRadius: 8,
    gap: 8,
  },
  primaryPlayBtn: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 6,
    gap: 8,
  },
  primaryPlayText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '900',
  },
  primaryUpcomingText: {
    color: '#FCD34D',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  actionPillBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D0F16',
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: '#191D2A',
  },
  actionPillBtnActive: {
    borderColor: '#4ADE80',
    backgroundColor: 'rgba(74, 222, 128, 0.08)',
  },
  actionPillText: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '700',
  },
  actionPillTextActive: {
    color: '#4ADE80',
  },
  watchlistBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D0F16',
    paddingVertical: 12,
    borderRadius: 6,
    gap: 6,
    borderWidth: 1,
    borderColor: '#191D2A',
  },
  watchlistBtnActive: {
    borderColor: '#4ADE80',
  },
  watchlistText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  watchlistTextActive: {
    color: '#4ADE80',
  },
  advisoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 6,
    paddingVertical: 7,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  advisoryBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  advisoryBadgeText: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  advisoryText: {
    flex: 1,
    color: '#8A94A6',
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 15,
  },
  genreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  genrePill: {
    backgroundColor: '#0B0D13',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#151822',
  },
  genrePillText: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '600',
  },
  genreHeadingText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  sectionBlock: {
    marginBottom: 20,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 1,
    marginBottom: 8,
  },
  overviewText: {
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 21,
  },
  keyCrewRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#10121A',
  },
  crewCol: {
    flex: 1,
    minWidth: 120,
  },
  crewJobLabel: {
    color: '#555E75',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  crewNameText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  castScroll: {
    paddingVertical: 6,
    gap: 12,
  },
  castCard: {
    width: 80,
    alignItems: 'center',
    marginRight: 4,
  },
  castAvatarWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: '#0E1017',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#171A24',
  },
  castAvatarImg: {
    width: '100%',
    height: '100%',
  },
  castAvatarFallback: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#12141C',
  },
  castAvatarInitials: {
    color: '#9CA3AF',
    fontSize: 18,
    fontWeight: '800',
  },
  castActorName: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  castRoleName: {
    color: '#71798E',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 1,
  },
  networksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  networkBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 32,
    minWidth: 64,
  },
  networkLogoImg: {
    width: 68,
    height: 20,
  },
  networkBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  seasonScroll: {
    paddingVertical: 6,
    gap: 8,
  },
  seasonTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#0B0D13',
    borderWidth: 1,
    borderColor: '#171A24',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  seasonTabActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  seasonTabText: {
    color: '#8A92A6',
    fontSize: 12,
    fontWeight: '700',
  },
  seasonTabTextActive: {
    color: '#000000',
    fontWeight: '900',
  },
  seasonTabEpCount: {
    color: '#555C70',
    fontSize: 10,
    fontWeight: '600',
  },
  seasonTabEpCountActive: {
    color: '#444444',
    fontWeight: '700',
  },
  episodeList: {
    gap: 10,
    marginTop: 8,
  },
  episodeListWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  episodeCard: {
    flexDirection: 'row',
    backgroundColor: '#0A0C12',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#141720',
    overflow: 'hidden',
    padding: 8,
    gap: 10,
  },
  episodeCardWide: {
    width: '49%',
  },
  epThumbWrap: {
    width: 104,
    height: 60,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#0E1017',
    position: 'relative',
  },
  epThumbImg: {
    width: '100%',
    height: '100%',
  },
  epThumbPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0B0D13',
  },
  epPlayBadge: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -10,
    marginLeft: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  epRuntimeBadge: {
    position: 'absolute',
    bottom: 3,
    right: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
  },
  epRuntimeText: {
    color: '#CBD0DF',
    fontSize: 9,
    fontWeight: '700',
  },
  epInfoWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  epTitleText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 4,
  },
  epOverviewText: {
    color: '#8A92A6',
    fontSize: 11,
    lineHeight: 15,
  },
  infoTableGrid: {
    backgroundColor: '#080A0F',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#131620',
    padding: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 12,
    columnGap: 16,
  },
  infoCell: {
    width: '47%',
  },
  infoCellLabel: {
    color: '#555E75',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  infoCellValue: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600',
  },
  relatedScroll: {
    paddingVertical: 6,
    gap: 10,
  },
  relatedCard: {
    width: 110,
    marginRight: 4,
  },
  relatedPoster: {
    width: 110,
    height: 160,
    borderRadius: 6,
    backgroundColor: '#0A0C12',
    marginBottom: 6,
  },
  relatedRatingBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  relatedRatingText: {
    color: '#F4C042',
    fontSize: 10,
    fontWeight: '800',
  },
  relatedTitle: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '700',
  },
  relatedYear: {
    color: '#6B7280',
    fontSize: 10,
    marginTop: 1,
  },
  noSimilarText: {
    color: '#6B7280',
    fontSize: 12,
    fontStyle: 'italic',
  },
  footerMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#10121A',
  },
  footerTmdbId: {
    color: '#4B5267',
    fontSize: 10,
    fontFamily: 'monospace',
  },
  footerVotes: {
    color: '#6B7280',
    fontSize: 11,
  },
  indicatorMargin: {
    marginVertical: 14,
  },
  roundControlBtnFocused: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 20,
    transform: [{ scale: 1.15 }],
  },
  roundControlBtnFocusRing: {
    borderColor: '#FFFFFF',
    borderWidth: 2.5,
    borderRadius: 20,
  },
  billboardWatchNowBtnFocused: {
    backgroundColor: '#FFFFFF',
    transform: [{ scale: 1.06 }],
  },
  billboardWatchNowFocusRing: {
    borderColor: '#F59E0B',
    borderWidth: 3.5,
    borderRadius: 8,
  },
  billboardUpcomingBtnFocused: {
    backgroundColor: 'rgba(245, 158, 11, 0.35)',
    transform: [{ scale: 1.06 }],
  },
  billboardUpcomingFocusRing: {
    borderColor: '#F59E0B',
    borderWidth: 3.5,
    borderRadius: 8,
  },
  billboardActionPillBtnFocused: {
    backgroundColor: '#1E2436',
    borderColor: '#FFFFFF',
    borderWidth: 1.5,
    transform: [{ scale: 1.05 }],
  },
  pillFocusRing: {
    borderColor: '#FFFFFF',
    borderWidth: 2.5,
    borderRadius: 8,
  },
  muteBtnFocusRing: {
    borderColor: '#FFFFFF',
    borderWidth: 2.5,
    borderRadius: 6,
  },
  primaryPlayBtnFullFocused: {
    backgroundColor: '#FFFFFF',
    transform: [{ scale: 1.04 }],
  },
  primaryUpcomingBtnFullFocused: {
    backgroundColor: 'rgba(245, 158, 11, 0.35)',
    transform: [{ scale: 1.04 }],
  },
  actionPillBtnFocused: {
    backgroundColor: '#1E2436',
    borderColor: '#FFFFFF',
    borderWidth: 1.5,
    transform: [{ scale: 1.04 }],
  },
  seasonTabFocused: {
    backgroundColor: '#171E2D',
    borderColor: '#38BDF8',
    borderWidth: 1.5,
    transform: [{ scale: 1.05 }],
  },
  seasonTabFocusRing: {
    borderColor: '#38BDF8',
    borderWidth: 2.5,
    borderRadius: 6,
  },
  seasonTabActiveFocused: {
    backgroundColor: '#FFFFFF',
    transform: [{ scale: 1.08 }],
  },
  seasonTabActiveFocusRing: {
    borderColor: '#F59E0B',
    borderWidth: 3.5,
    borderRadius: 6,
  },
  episodeCardFocused: {
    backgroundColor: '#131A28',
    borderColor: '#38BDF8',
    borderWidth: 1.5,
    transform: [{ scale: 1.025 }],
    zIndex: 10,
  },
  episodeCardFocusRing: {
    borderColor: '#38BDF8',
    borderWidth: 2.5,
    borderRadius: 8,
  },
  relatedCardFocused: {
    transform: [{ scale: 1.08 }],
    zIndex: 20,
  },
  relatedCardFocusRing: {
    borderColor: '#FFFFFF',
    borderWidth: 3,
    borderRadius: 6,
    height: 160,
  },
  btnFocused: {
    zIndex: 10,
  },
  cardFocused: {
    zIndex: 10,
    backgroundColor: '#161924',
  },
});
