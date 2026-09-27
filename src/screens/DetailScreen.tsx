import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  ActivityIndicator,
  StyleSheet,
  BackHandler,
} from 'react-native';
import Video, { ResizeMode } from 'react-native-video';
import { WebView } from 'react-native-webview';
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
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [titleLogo, setTitleLogo] = useState<string | null>(null);
  const [failedLogo, setFailedLogo] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

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

  const webViewRef = useRef<any>(null);

  // Top Navbar space identical to HomePage, with the banner/trailer starting cleanly below it
  const navbarHeight = isWide ? 56 : topInset + 48;
  const bannerHeight = isWide
    ? Math.round(Math.min(height * 0.58, 480))
    : Math.round(width * (9 / 16));

  const imageTop = navbarHeight;
  const headerTotalHeight = bannerHeight + navbarHeight;
  const fadeHeight = Math.round(bannerHeight * 0.72);

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

    // 1. Trailer fetch & 2s delay timer
    if (currentMedia.trailerUrl || currentMedia.trailerKey) {
      setTrailerUrl(currentMedia.trailerUrl || null);
      setTrailerKey(currentMedia.trailerKey || null);
    } else {
      fetchMediaTrailer(currentMedia.id, currentMedia.type)
        .then(tData => {
          if (isMounted && tData) {
            setTrailerUrl(tData.url || null);
            setTrailerKey(tData.key || null);
          }
        })
        .catch(() => {});
    }

    // 2. Logo fetch
    if (currentMedia.titleLogo) {
      setTitleLogo(currentMedia.titleLogo);
    } else {
      fetchMediaLogo(currentMedia.id, currentMedia.type)
        .then(logo => {
          if (isMounted) setTitleLogo(logo);
        })
        .catch(() => {});
    }

    // 3. Networks fetch
    fetchMediaNetworks(currentMedia.id, currentMedia.type)
      .then(res => {
        if (isMounted) setNetworks(res);
      })
      .catch(() => {});

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
      .catch(() => {});

    // 5. Extended Details (Advisories, Runtime, Release Date, Budget) fetch
    fetchMediaExtendedDetails(currentMedia.id, currentMedia.type)
      .then(extData => {
        if (isMounted) {
          setExtendedDetails(extData);
        }
      })
      .catch(() => {});

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

  // Sync Mute State with Embedded YouTube Trailer
  useEffect(() => {
    if (showTrailer && webViewRef.current) {
      const js = isMuted
        ? 'if (window.__ytPlayer && window.__ytPlayer.mute) { window.__ytPlayer.mute(); } true;'
        : 'if (window.__ytPlayer && window.__ytPlayer.unMute) { window.__ytPlayer.unMute(); window.__ytPlayer.setVolume(100); } true;';
      webViewRef.current.injectJavaScript(js);
    }
  }, [isMuted, showTrailer]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  const handleTrailerEnded = useCallback(() => {
    setShowTrailer(false);
  }, []);

  const handleWebViewMessage = useCallback(
    (event: any) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.event === 'ended' || data.event === 'error') {
          handleTrailerEnded();
        }
      } catch {
        // Ignore parse error
      }
    },
    [handleTrailerEnded]
  );

  const handleSelectRelated = useCallback((item: MediaItem) => {
    setCurrentMedia(item);
    if (onSelectMedia) {
      onSelectMedia(item);
    }
  }, [onSelectMedia]);

  const backdropUri = currentMedia.backdrop || currentMedia.poster || undefined;
  const hasTrailer = Boolean(trailerUrl || trailerKey);
  const displayCertification = extendedDetails?.certification || 'U/A 16+';
  const displayRuntime = extendedDetails?.runtimeFormatted;

  return (
    <View style={styles.screenRoot}>
      {/* Dark Top Navbar Bar (Exact same height & space as Home page) */}
      <View
        style={[
          styles.topNavbar,
          {
            height: navbarHeight,
            paddingTop: isWide ? 10 : topInset + 6,
          },
        ]}>
        <TVFocusable
          style={styles.roundControlBtn}
          focusedStyle={styles.btnFocused}
          hasTVPreferredFocus={false}
          onPress={onBack}>
          <BackIcon color="#FFFFFF" size={16} />
        </TVFocusable>

        <View style={styles.topNavbarBrand}>
          <Image
            source={require('../assets/logo.png')}
            style={styles.brandLogoSmall}
            resizeMode="contain"
          />
        </View>

        {hasTrailer ? (
          <TVFocusable
            style={styles.roundControlBtn}
            focusedStyle={styles.btnFocused}
            onPress={toggleMute}>
            {isMuted ? (
              <VolumeMuteIcon color="#FFFFFF" size={16} />
            ) : (
              <VolumeIcon color="#FFFFFF" size={16} />
            )}
          </TVFocusable>
        ) : (
          <View style={styles.navPlaceholderBtn} />
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.containerScroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset + 80 }]}
        showsVerticalScrollIndicator={false}>
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
                muted={isMuted}
                repeat={true}
                paused={!showTrailer}
                playInBackground={false}
                playWhenInactive={false}
                ignoreSilentSwitch="ignore"
                onError={handleTrailerEnded}
              />
            </View>
          ) : null}

          {/* Embedded YouTube Fallback Trailer */}
          {showTrailer && !trailerUrl && trailerKey ? (
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
              <WebView
                ref={webViewRef}
                key={`detail-yt-${currentMedia.id}-${trailerKey}`}
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
                            videoId: '${trailerKey}',
                            playerVars: {
                              'autoplay': 1,
                              'mute': ${isMuted ? 1 : 0},
                              'controls': 0,
                              'showinfo': 0,
                              'rel': 0,
                              'loop': 1,
                              'playlist': '${trailerKey}',
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
              />
            </View>
          ) : null}

          {/* Bottom Lossless GPU Gradient Fade */}
          <View style={styles.bottomOverlayWrap} pointerEvents="none">
            <BillboardFadedOverlay height={fadeHeight} />
          </View>

          {/* Title / Name Image of the Movie or Series Displayed Directly ON the Banner & Trailer */}
          <View style={[styles.bannerOverlayContent, isWide && styles.bannerOverlayContentWide]} pointerEvents="none">
            {titleLogo && !failedLogo ? (
              <Image
                source={{ uri: titleLogo }}
                style={[styles.bannerTitleLogoImg, isWide && styles.bannerTitleLogoImgWide]}
                resizeMode="contain"
                onError={() => setFailedLogo(true)}
              />
            ) : (
              <Text style={[styles.bannerTitleText, isWide && styles.bannerTitleTextWide]} numberOfLines={2}>
                {currentMedia.title}
              </Text>
            )}

            {extendedDetails?.tagline ? (
              <Text style={styles.bannerTaglineText} numberOfLines={1}>
                "{extendedDetails.tagline}"
              </Text>
            ) : null}
          </View>
        </View>

        {/* 2. BODY CONTENT SECTION */}
        <View style={[styles.bodyContent, isWide && styles.bodyContentWide]}>
          {/* Meta Tags Row: Rating, Year, HD Badges, Runtime */}
          <View style={styles.metaRow}>
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>★ {currentMedia.rating.toFixed(1)}</Text>
            </View>
            <Text style={styles.metaYear}>{currentMedia.year}</Text>
            {displayRuntime ? (
              <Text style={styles.metaRuntime}>{displayRuntime}</Text>
            ) : null}
            <View style={styles.tagPill}>
              <Text style={styles.tagPillText}>{displayCertification}</Text>
            </View>
            <View style={styles.tagPill}>
              <Text style={styles.tagPillText}>4K ULTRA HD</Text>
            </View>
            <View style={styles.tagPill}>
              <Text style={styles.tagPillText}>DOLBY 5.1</Text>
            </View>
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>{currentMedia.type.toUpperCase()}</Text>
            </View>
          </View>

          {/* Action Buttons Row: Play / Watch Now & Watchlist */}
          <View style={styles.actionRow}>
            <TVFocusable
              style={styles.primaryPlayBtn}
              focusedStyle={styles.btnFocused}
              hasTVPreferredFocus={true}
              onPress={() => {
                if (onPlay) {
                  onPlay(currentMedia, selectedSeason, 1);
                }
              }}>
              <PlayIcon color="#000000" size={16} />
              <Text style={styles.primaryPlayText}>
                {currentMedia.type === 'tv' ? `Play S${selectedSeason} E1` : 'Watch Now'}
              </Text>
            </TVFocusable>

            <TVFocusable
              style={[
                styles.watchlistBtn,
                isInWatchlist && styles.watchlistBtnActive,
              ]}
              focusedStyle={styles.btnFocused}
              onPress={() => onToggleWatchlist(currentMedia)}>
              {isInWatchlist ? (
                <CheckIcon color="#4ADE80" size={15} />
              ) : (
                <PlusIcon color="#FFFFFF" size={15} />
              )}
              <Text
                style={[
                  styles.watchlistText,
                  isInWatchlist && styles.watchlistTextActive,
                ]}>
                {isInWatchlist ? 'Added' : 'Watchlist'}
              </Text>
            </TVFocusable>
          </View>

          {/* Content Advisory Badges */}
          {extendedDetails?.contentAdvisories && extendedDetails.contentAdvisories.length > 0 && (
            <View style={styles.advisoryContainer}>
              <View style={styles.advisoryHeaderRow}>
                <Text style={styles.advisoryLabel}>CONTENT ADVISORY</Text>
                <Text style={styles.advisoryCert}>{displayCertification}</Text>
              </View>
              <View style={styles.advisoryBadgesRow}>
                {extendedDetails.contentAdvisories.map(adv => (
                  <View key={adv} style={styles.advisoryPill}>
                    <Text style={styles.advisoryPillText}>{adv}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Genre Pills */}
          {currentMedia.genres.length > 0 && (
            <View style={styles.genreRow}>
              {currentMedia.genres.map(g => (
                <View key={g} style={styles.genrePill}>
                  <Text style={styles.genrePillText}>{g}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Storyline / Overview */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionHeading}>STORYLINE</Text>
            <Text style={styles.overviewText}>
              {currentMedia.overview || 'No description available for this title.'}
            </Text>
          </View>

          {/* Directors, Creators & Writers Row */}
          {(directors.length > 0 || creators.length > 0 || writers.length > 0) && (
            <View style={styles.keyCrewRow}>
              {directors.length > 0 && (
                <View style={styles.crewCol}>
                  <Text style={styles.crewJobLabel}>DIRECTOR</Text>
                  <Text style={styles.crewNameText}>
                    {directors.map(d => d.name).join(', ')}
                  </Text>
                </View>
              )}
              {creators.length > 0 && (
                <View style={styles.crewCol}>
                  <Text style={styles.crewJobLabel}>CREATOR</Text>
                  <Text style={styles.crewNameText}>
                    {creators.map(c => c.name).join(', ')}
                  </Text>
                </View>
              )}
              {writers.length > 0 && (
                <View style={styles.crewCol}>
                  <Text style={styles.crewJobLabel}>WRITERS</Text>
                  <Text style={styles.crewNameText}>
                    {writers.map(w => w.name).join(', ')}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Star Cast Horizontal Rail */}
          {cast.length > 0 && (
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeading}>TOP CAST</Text>
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

          {/* 4. EXTENDED INFORMATION GRID */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionHeading}>DETAILS & INFORMATION</Text>
            <View style={styles.infoTableGrid}>
              {extendedDetails?.releaseDateFormatted ? (
                <View style={styles.infoCell}>
                  <Text style={styles.infoCellLabel}>RELEASE DATE</Text>
                  <Text style={styles.infoCellValue}>{extendedDetails.releaseDateFormatted}</Text>
                </View>
              ) : null}

              {extendedDetails?.status ? (
                <View style={styles.infoCell}>
                  <Text style={styles.infoCellLabel}>STATUS</Text>
                  <Text style={styles.infoCellValue}>{extendedDetails.status}</Text>
                </View>
              ) : null}

              {extendedDetails?.originalLanguageFormatted ? (
                <View style={styles.infoCell}>
                  <Text style={styles.infoCellLabel}>ORIGINAL AUDIO</Text>
                  <Text style={styles.infoCellValue}>{extendedDetails.originalLanguageFormatted}</Text>
                </View>
              ) : null}

              {extendedDetails?.spokenLanguages && extendedDetails.spokenLanguages.length > 0 ? (
                <View style={styles.infoCell}>
                  <Text style={styles.infoCellLabel}>AUDIO & SUBTITLES</Text>
                  <Text style={styles.infoCellValue} numberOfLines={2}>
                    {extendedDetails.spokenLanguages.slice(0, 4).join(', ')}
                  </Text>
                </View>
              ) : null}

              {extendedDetails?.budgetFormatted ? (
                <View style={styles.infoCell}>
                  <Text style={styles.infoCellLabel}>BUDGET</Text>
                  <Text style={styles.infoCellValue}>{extendedDetails.budgetFormatted}</Text>
                </View>
              ) : null}

              {extendedDetails?.revenueFormatted ? (
                <View style={styles.infoCell}>
                  <Text style={styles.infoCellLabel}>BOX OFFICE</Text>
                  <Text style={styles.infoCellValue}>{extendedDetails.revenueFormatted}</Text>
                </View>
              ) : null}

              {extendedDetails?.productionCountries && extendedDetails.productionCountries.length > 0 ? (
                <View style={styles.infoCell}>
                  <Text style={styles.infoCellLabel}>PRODUCTION</Text>
                  <Text style={styles.infoCellValue} numberOfLines={1}>
                    {extendedDetails.productionCountries.join(', ')}
                  </Text>
                </View>
              ) : null}

              <View style={styles.infoCell}>
                <Text style={styles.infoCellLabel}>COMMUNITY RATING</Text>
                <Text style={styles.infoCellValue}>
                  ★ {currentMedia.rating.toFixed(1)} ({currentMedia.voteCount.toLocaleString()} votes)
                </Text>
              </View>
            </View>
          </View>

          {/* 5. RELATED CONTENT / MORE LIKE THIS RAIL */}
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

          {/* TMDB Meta Footer */}
          <View style={styles.footerMeta}>
            <Text style={styles.footerTmdbId}>TMDB ID: {currentMedia.id}</Text>
            <Text style={styles.footerVotes}>
              {currentMedia.voteCount.toLocaleString()} community ratings
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
    backgroundColor: '#08090D',
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
    backgroundColor: 'rgba(8, 9, 13, 0.98)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
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
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(20, 24, 35, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  containerScroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 56,
  },
  headerWrap: {
    position: 'relative',
    backgroundColor: '#08090D',
    overflow: 'hidden',
  },
  backdropImage: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#111420',
  },
  trailerContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#08090D',
    overflow: 'hidden',
  },
  nativeVideo: {
    width: '100%',
    height: '100%',
  },
  webView: {
    width: '100%',
    height: '100%',
    backgroundColor: '#08090D',
  },
  bottomOverlayWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  bannerOverlayContent: {
    position: 'absolute',
    bottom: 14,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  bannerOverlayContentWide: {
    bottom: 22,
    left: 24,
    right: 24,
    maxWidth: 620,
  },
  bannerTitleLogoImg: {
    width: 230,
    height: 64,
    marginBottom: 4,
  },
  bannerTitleLogoImgWide: {
    width: 300,
    height: 84,
    marginBottom: 6,
  },
  bannerTitleText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.95)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  bannerTitleTextWide: {
    fontSize: 30,
  },
  bannerTaglineText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  bodyContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  bodyContentWide: {
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 14,
  },
  ratingBadge: {
    backgroundColor: '#1E2332',
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
    backgroundColor: '#2A334E',
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
    gap: 12,
    marginBottom: 16,
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
  watchlistBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#161924',
    paddingVertical: 12,
    borderRadius: 6,
    gap: 6,
    borderWidth: 1,
    borderColor: '#262D40',
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
  advisoryContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E2333',
    padding: 10,
    marginBottom: 16,
  },
  advisoryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  advisoryLabel: {
    color: '#6B7280',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  advisoryCert: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '800',
  },
  advisoryBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  advisoryPill: {
    backgroundColor: '#171B28',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#242C40',
  },
  advisoryPillText: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: '700',
  },
  genreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  genrePill: {
    backgroundColor: '#141722',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#202538',
  },
  genrePillText: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '600',
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
    borderBottomColor: '#161924',
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
    backgroundColor: '#1A1E2E',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#242C40',
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
    backgroundColor: '#202638',
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
    backgroundColor: '#141722',
    borderWidth: 1,
    borderColor: '#22283A',
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
    backgroundColor: '#12141F',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1C2030',
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
    backgroundColor: '#1A1E2E',
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
    backgroundColor: '#151824',
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
    backgroundColor: '#0F121B',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1A2030',
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
    backgroundColor: '#161924',
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
    borderTopColor: '#161924',
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
    backgroundColor: '#1E2338',
    transform: [{ scale: 1.03 }],
  },
});
