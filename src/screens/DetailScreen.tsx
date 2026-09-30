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
  CrewMember,
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
} from '../components/common/Icons';
import { BillboardFadedOverlay } from '../components/common/FadedOverlay';
import { TVFocusable } from '../components/common/TVFocusable';
import { useDeviceMode } from '../hooks/useDeviceMode';

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

  // Sync initialMedia from props
  useEffect(() => {
    setCurrentMedia(initialMedia);
  }, [initialMedia]);

  // Scroll ref to reset to top on media change
  const scrollRef = useRef<any>(null);

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
  const [directors, setDirectors] = useState<CrewMember[]>([]);
  const [creators, setCreators] = useState<CrewMember[]>([]);
  const [writers, setWriters] = useState<CrewMember[]>([]);
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
  const safeStatusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0;
  const effectiveTopInset = isTV ? 12 : Math.max(topInset || 0, safeStatusBarHeight, 32) + 6;
  const bannerHeight = isWide
    ? Math.round(Math.min(height * 0.58, 480))
    : Math.round(width * (9 / 16));

  const imageTop = effectiveTopInset;
  const headerTotalHeight = bannerHeight + imageTop;
  const fadeHeight = Math.round(bannerHeight * 0.75);

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
          setDirectors(cData.directors);
          setCreators(cData.creators);
          setWriters(cData.writers);
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
  }, [currentMedia]);

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
    } catch (error) {
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

  const hasTrailer = Boolean(trailerUrl);

  const stickyNavPaddingTop = isWide
    ? 8
    : Platform.OS === 'android'
      ? (StatusBar.currentHeight || 24) + 4
      : Math.max(topInset || 0, 16);

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
          style={styles.roundControlBtn}
          focusedStyle={styles.btnFocused}
          hasTVPreferredFocus={false}
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

          {/* Bottom Lossless GPU Gradient Fade */}
          <View style={styles.bottomOverlayWrap} pointerEvents="none">
            <BillboardFadedOverlay height={fadeHeight} />
          </View>

          {/* Bottom Right Volume Mute / Unmute Button */}
          {hasTrailer && showTrailer ? (
            <View style={[styles.bannerMuteWrap, isWide && styles.bannerMuteWrapWide]}>
              <TVFocusable
                style={styles.bannerMuteBtn}
                focusedStyle={styles.bannerMuteBtnFocused}
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
        <View style={[styles.bodyContent, isWide && styles.bodyContentWide]}>
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

          {/* Action Buttons Row: Full Width Watch Now / Play */}
          <View style={styles.actionRow}>
            <TVFocusable
              style={styles.primaryPlayBtnFull}
              focusedStyle={styles.btnFocused}
              hasTVPreferredFocus={true}
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
          </View>

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

          {/* Below Storyline Actions: Watchlist & Share */}
          <View style={styles.secondaryActionsRow}>
            <TVFocusable
              style={[
                styles.actionPillBtn,
                isInWatchlist && styles.actionPillBtnActive,
              ]}
              focusedStyle={styles.btnFocused}
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
              style={styles.actionPillBtn}
              focusedStyle={styles.btnFocused}
              onPress={handleShare}>
              <ShareIcon color="#FFFFFF" size={18} />
              <Text style={styles.actionPillText}>Share</Text>
            </TVFocusable>
          </View>

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
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeading}>SEASONS & EPISODES</Text>

              {loadingSeasons ? (
                <ActivityIndicator size="small" color="#FFFFFF" style={styles.indicatorMargin} />
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.seasonScroll}>
                  {seasons.map(s => {
                    const isActive = s.seasonNumber === selectedSeason;
                    return (
                      <TVFocusable
                        key={s.id}
                        style={[styles.seasonTab, isActive && styles.seasonTabActive]}
                        focusedStyle={styles.btnFocused}
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
                <View style={[styles.episodeList, isWide && styles.episodeListWide]}>
                  {episodes.map(ep => (
                    <TVFocusable
                      key={ep.id}
                      style={[styles.episodeCard, isWide && styles.episodeCardWide]}
                      focusedStyle={styles.cardFocused}
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
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionHeading}>MORE LIKE THIS</Text>

            {loadingSimilar ? (
              <ActivityIndicator size="small" color="#FFFFFF" style={styles.indicatorMargin} />
            ) : similarMedia.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.relatedScroll}>
                {similarMedia.map(item => (
                  <TVFocusable
                    key={item.id}
                    style={styles.relatedCard}
                    focusedStyle={styles.cardFocused}
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
    marginBottom: 16,
  },
  primaryPlayBtnFull: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
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
    tintColor: '#FFFFFF',
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
  btnFocused: {
    borderColor: '#FFFFFF',
    borderWidth: 2,
    transform: [{ scale: 1.05 }],
  },
  cardFocused: {
    borderColor: '#FFFFFF',
    borderWidth: 2,
    backgroundColor: '#161924',
    transform: [{ scale: 1.03 }],
  },
});
