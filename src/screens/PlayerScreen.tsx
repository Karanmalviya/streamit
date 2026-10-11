import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ActivityIndicator,
  BackHandler,
  StatusBar,
  ScrollView,
  Image,
  NativeModules,
  Animated,
  DeviceEventEmitter,
} from 'react-native';
import Video, {
  VideoRef,
  OnLoadData,
  OnProgressData,
  ResizeMode,
  SelectedTrackType,
  TextTrackType,
  AudioTrack,
  TextTrack,
  ViewType,
} from 'react-native-video';
import { WebView } from 'react-native-webview';

const NativeWebView = WebView as any;

import {
  PlayIcon,
  PauseIcon,
  BackIcon,
  Forward10Icon,
  Replay10Icon,
  FullscreenIcon,
  ExitFullscreenIcon,
  BookmarkIcon,
  CCIcon,
  SettingsIcon,
  EpisodesIcon,
} from '../components/common/Icons';
import { TVFocusable } from '../components/common/TVFocusable';
import { TracksModal, AudioTrackOption, SubtitleTrackOption } from '../components/modals/TracksModal';
import { PlayerSettingsModal, CleanQualityOption, SettingsTab } from '../components/modals/PlayerSettingsModal';
import { EpisodesModal } from '../components/modals/EpisodesModal';
import { parseSubtitles, SubtitleCue } from '../utils/subtitleParser';
import { StreamSource, getPreferred720pSource } from '../services/providers';
import { addToWatchHistory, getWatchHistory } from '../services/history';
import { useDeviceMode } from '../hooks/useDeviceMode';
import {
  MediaItem,
  fetchSimilarMedia,
  TVSeason,
  TVEpisode,
  fetchTVSeasons,
  fetchTVEpisodes,
} from '../services/tmdb';
import { fetchIntroSegments, MediaSegments } from '../services/introdb';

// Injected script for Embed (WebView) that blocks popups, enables audio by default, synchronizes video playback/state, and handles fullscreen changes
const INJECTED_WEB_SYNC = `
  (function() {
    try {
      var style = document.createElement('style');
      style.innerHTML = 'html, body { width: 100% !important; height: 100% !important; margin: 0 !important; padding: 0 !important; overflow: hidden !important; background: #000 !important; } iframe, video { width: 100% !important; height: 100% !important; border: 0 !important; }';
      if (document.head) {
        document.head.appendChild(style);
      } else if (document.documentElement) {
        document.documentElement.appendChild(style);
      }
    } catch(e) {}

    window.open = function() { return null; };
    document.addEventListener('click', function(e) {
      var node = e.target;
      while (node && node.tagName !== 'A') { node = node.parentNode; }
      if (node && node.tagName === 'A') { node.removeAttribute('target'); }
    }, true);

    function postFsState(isFs) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'FULLSCREEN_CHANGE',
          isFullscreen: !!isFs
        }));
      }
    }

    function checkFullscreen() {
      var isFs = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      postFsState(isFs);
    }

    var lastActivityTime = 0;
    function reportActivity() {
      var now = Date.now();
      if (now - lastActivityTime > 250) {
        lastActivityTime = now;
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'WEB_USER_ACTIVITY'
          }));
        }
      }
    }

    document.addEventListener('touchstart', reportActivity, { capture: true, passive: true });
    document.addEventListener('touchend', reportActivity, { capture: true, passive: true });
    document.addEventListener('pointerdown', reportActivity, { capture: true, passive: true });
    document.addEventListener('mousedown', reportActivity, { capture: true, passive: true });
    document.addEventListener('click', reportActivity, { capture: true, passive: true });
    document.addEventListener('mousemove', reportActivity, { capture: true, passive: true });
    window.addEventListener('touchstart', reportActivity, { capture: true, passive: true });
    window.addEventListener('pointerdown', reportActivity, { capture: true, passive: true });
    window.addEventListener('click', reportActivity, { capture: true, passive: true });

    document.addEventListener('fullscreenchange', function() { checkFullscreen(); reportActivity(); });
    document.addEventListener('webkitfullscreenchange', function() { checkFullscreen(); reportActivity(); });
    document.addEventListener('mozfullscreenchange', function() { checkFullscreen(); reportActivity(); });
    document.addEventListener('MSFullscreenChange', function() { checkFullscreen(); reportActivity(); });
    window.addEventListener('fullscreenchange', function() { checkFullscreen(); reportActivity(); });
    window.addEventListener('webkitfullscreenchange', function() { checkFullscreen(); reportActivity(); });

    try {
      if (Element.prototype.requestFullscreen) {
        var _req = Element.prototype.requestFullscreen;
        Element.prototype.requestFullscreen = function() {
          postFsState(true);
          return _req.apply(this, arguments);
        };
      }
      if (Element.prototype.webkitRequestFullscreen) {
        var _wreq = Element.prototype.webkitRequestFullscreen;
        Element.prototype.webkitRequestFullscreen = function() {
          postFsState(true);
          return _wreq.apply(this, arguments);
        };
      }
      if (HTMLVideoElement.prototype.webkitEnterFullscreen) {
        var _wef = HTMLVideoElement.prototype.webkitEnterFullscreen;
        HTMLVideoElement.prototype.webkitEnterFullscreen = function() {
          postFsState(true);
          return _wef.apply(this, arguments);
        };
      }
      if (document.exitFullscreen) {
        var _exit = document.exitFullscreen;
        document.exitFullscreen = function() {
          postFsState(false);
          return _exit.apply(this, arguments);
        };
      }
      if (document.webkitExitFullscreen) {
        var _wexit = document.webkitExitFullscreen;
        document.webkitExitFullscreen = function() {
          postFsState(false);
          return _wexit.apply(this, arguments);
        };
      }
    } catch(e) {}

    function ensurePlay(v) {
      try {
        if (v) {
          v.muted = false;
          if (v.volume < 1) v.volume = 1.0;
          if (v.paused) {
            var p = v.play();
            if (p && p.catch) {
              p.catch(function() {
                v.muted = true;
                v.play();
              });
            }
          }
        }
      } catch(e) {}
    }

    function findVideo() {
      try {
        var v = document.querySelector('video');
        if (v) return v;
        var frames = document.querySelectorAll('iframe');
        for (var i = 0; i < frames.length; i++) {
          try {
            var fv = frames[i].contentWindow.document.querySelector('video');
            if (fv) return fv;
          } catch(e) {}
        }
      } catch(err) {}
      return null;
    }

    function getTracks(v) {
      var tracks = [];
      try {
        if (v && v.textTracks && v.textTracks.length > 0) {
          for (var i = 0; i < v.textTracks.length; i++) {
            var t = v.textTracks[i];
            tracks.push({
              index: i,
              title: t.label || t.language || ('Subtitle ' + (i + 1)),
              language: t.language || 'und'
            });
          }
        }
      } catch(e) {}
      return tracks;
    }

    function syncState() {
      var v = findVideo();
      if (v) {
        if (!v.__cinemaHooked) {
          v.__cinemaHooked = true;
          ensurePlay(v);
          v.addEventListener('webkitbeginfullscreen', function() { postFsState(true); });
          v.addEventListener('webkitendfullscreen', function() { postFsState(false); });
          var notify = function() {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'VIDEO_STATE',
                currentTime: v.currentTime || 0,
                duration: v.duration || 0,
                paused: v.paused,
                muted: v.muted,
                playbackRate: v.playbackRate || 1,
                videoWidth: v.videoWidth || 0,
                videoHeight: v.videoHeight || 0,
                tracks: getTracks(v)
              }));
            }
          };
          v.addEventListener('timeupdate', notify);
          v.addEventListener('play', function() {
            ensurePlay(v);
            notify();
          });
          v.addEventListener('pause', notify);
          v.addEventListener('loadedmetadata', function() {
            ensurePlay(v);
            notify();
          });
          v.addEventListener('durationchange', notify);
          v.addEventListener('ratechange', notify);
          v.addEventListener('volumechange', notify);
        }
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'VIDEO_STATE',
            currentTime: v.currentTime || 0,
            duration: v.duration || 0,
            paused: v.paused,
            muted: v.muted,
            playbackRate: v.playbackRate || 1,
            videoWidth: v.videoWidth || 0,
            videoHeight: v.videoHeight || 0,
            tracks: getTracks(v)
          }));
        }
      }
    }

    setInterval(syncState, 800);
  })();
  true;
`;

/**
 * Filter & curate sources so Native streams only list 480p, 720p, 1080p, and 4K (if available).
 */
function getCuratedQualitySources(sources: StreamSource[]): CleanQualityOption[] {
  const result: CleanQualityOption[] = [];
  const nativeList = sources.filter(s => s.format !== 'embed');
  const embedList = sources.filter(s => s.format === 'embed');

  const tiers: Array<{
    tier: '4K' | '1080p' | '720p' | '480p';
    match: (q: string, name: string) => boolean;
    label: string;
  }> = [
      {
        tier: '720p',
        match: (q, name) => q.includes('720') || name.toLowerCase().includes('720'),
        label: '720p High Definition (Default)',
      },
      {
        tier: '1080p',
        match: (q, name) => q.includes('1080') || name.toLowerCase().includes('1080'),
        label: '1080p Full HD',
      },
      {
        tier: '480p',
        match: (q, name) =>
          q.includes('480') ||
          q.includes('360') ||
          name.toLowerCase().includes('480') ||
          name.toLowerCase().includes('360'),
        label: '480p Standard Definition',
      },
      {
        tier: '4K',
        match: (q, name) =>
          q.includes('4k') ||
          q.includes('2160') ||
          name.toLowerCase().includes('4k') ||
          name.toLowerCase().includes('2160'),
        label: '4K Ultra HD',
      },
    ];

  for (const t of tiers) {
    const found = nativeList.find(s => t.match(s.quality.toLowerCase(), s.name));
    if (found) {
      result.push({
        tier: t.tier,
        label: t.label,
        source: found,
        isNative: true,
      });
    }
  }

  // Fallback: If no tiered streams matched but native streams exist, include top native stream
  if (result.length === 0 && nativeList.length > 0) {
    result.push({
      tier: '720p',
      label: '720p HD Direct',
      source: nativeList[0],
      isNative: true,
    });
  }

  // Include single clean embed server if available
  if (embedList.length > 0) {
    result.push({
      tier: 'Embed',
      label: 'Web Player (Embed)',
      source: embedList[0],
      isNative: false,
    });
  }

  return result;
}

interface PlayerScreenProps {
  media: MediaItem;
  source: StreamSource;
  availableSources?: StreamSource[];
  season?: number;
  episode?: number;
  topInset?: number;
  onClose: () => void;
  onSelectSource?: (source: StreamSource) => void;
  onSelectRelatedMedia?: (item: MediaItem) => void;
  onSelectEpisode?: (season: number, episode: number, episodeData?: TVEpisode) => void;
  onToggleWatchlist?: (item: MediaItem) => void;
  isInWatchlist?: boolean;
  initialProgress?: number;
}

export function PlayerScreen({
  media,
  source,
  availableSources = [],
  season = 1,
  episode = 1,
  topInset = 0,
  onClose,
  onSelectSource,
  onSelectRelatedMedia,
  onSelectEpisode,
  onToggleWatchlist,
  isInWatchlist = false,
  initialProgress = 0,
}: PlayerScreenProps) {
  const isEmbed = source.format === 'embed';
  const videoRef = useRef<VideoRef>(null);
  const webViewRef = useRef<any>(null);

  const { width: screenWidth, isTV } = useDeviceMode();

  // Save history and close
  const handleClosePlayer = useCallback(async () => {
    if (currentTimeRef.current > 5) {
      await addToWatchHistory({
        media,
        lastWatchedAt: Date.now(),
        progress: currentTimeRef.current,
        duration: durationRef.current,
        season,
        episode,
      });
    }
    onClose();
  }, [media, season, episode, onClose]);


  // Fullscreen state: TV is always fullscreen; Mobile is controlled by isFullscreen
  const [isFullscreen, setIsFullscreen] = useState(false);
  const effectiveFullscreen = isTV || isFullscreen;

  // Safe SystemBar helpers that prevent crashes when methods aren't available on bridge
  const safeLockLandscape = useCallback(() => {
    try {
      if (typeof NativeModules.SystemBarModule?.lockLandscape === 'function') {
        NativeModules.SystemBarModule.lockLandscape();
      }
    } catch {
      // ignore
    }
  }, []);

  const safeLockPortrait = useCallback(() => {
    try {
      if (typeof NativeModules.SystemBarModule?.lockPortrait === 'function') {
        NativeModules.SystemBarModule.lockPortrait();
      } else if (typeof NativeModules.SystemBarModule?.unlockOrientation === 'function') {
        NativeModules.SystemBarModule.unlockOrientation();
      }
    } catch {
      // ignore
    }
  }, []);

  const safeUnlockOrientation = useCallback(() => {
    try {
      if (typeof NativeModules.SystemBarModule?.unlockOrientation === 'function') {
        NativeModules.SystemBarModule.unlockOrientation();
      }
    } catch {
      // ignore
    }
  }, []);

  const safeHideSystemBars = useCallback(() => {
    try {
      if (typeof NativeModules.SystemBarModule?.hideSystemBars === 'function') {
        NativeModules.SystemBarModule.hideSystemBars();
      }
    } catch {
      // ignore
    }
  }, []);

  const safeShowSystemBars = useCallback(() => {
    try {
      if (typeof NativeModules.SystemBarModule?.showSystemBars === 'function') {
        NativeModules.SystemBarModule.showSystemBars();
      }
    } catch {
      // ignore
    }
  }, []);

  // Toggle Fullscreen with proper Landscape/Portrait rotation
  const toggleFullscreen = useCallback(() => {
    if (isTV) return;
    setIsFullscreen(prev => {
      const next = !prev;
      if (next) {
        safeLockLandscape();
        safeHideSystemBars();
      } else {
        safeLockPortrait();
        safeShowSystemBars();
        setTimeout(() => {
          safeUnlockOrientation();
        }, 800);
      }
      return next;
    });
  }, [isTV, safeLockLandscape, safeLockPortrait, safeUnlockOrientation, safeHideSystemBars, safeShowSystemBars]);

  // Related content
  const [relatedItems, setRelatedItems] = useState<MediaItem[]>([]);

  // TV Seasons & Episodes State
  const [showEpisodesModal, setShowEpisodesModal] = useState(false);
  const [tvSeasons, setTvSeasons] = useState<TVSeason[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<number>(season);
  const [tvEpisodes, setTvEpisodes] = useState<TVEpisode[]>([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState<boolean>(false);

  // Sync StatusBar visibility with effectiveFullscreen
  useEffect(() => {
    StatusBar.setHidden(effectiveFullscreen, 'fade');
    return () => {
      StatusBar.setHidden(false, 'fade');
    };
  }, [effectiveFullscreen]);

  // Ensure orientation & system bars are restored when Player unmounts
  useEffect(() => {
    return () => {
      if (!isTV) {
        safeLockPortrait();
        safeShowSystemBars();
        setTimeout(() => {
          safeUnlockOrientation();
        }, 600);
      }
    };
  }, [isTV, safeLockPortrait, safeShowSystemBars, safeUnlockOrientation]);
  const [paused, setPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [trackWidth, setTrackWidth] = useState(0);

  // High precision time & duration refs
  const currentTimeRef = useRef<number>(0);
  const durationRef = useRef<number>(0);
  const seekLockUntilRef = useRef<number>(0);
  const isScrubbingRef = useRef<boolean>(false);
  const [scrubbingTime, setScrubbingTime] = useState<number | null>(null);
  const trackRef = useRef<any>(null);
  const trackWidthRef = useRef<number>(0);
  const trackLeftRef = useRef<number>(0);
  const playPauseRef = useRef<any>(null);
  const scrubberFocusRef = useRef<any>(null);
  const [isScrubberFocused, setIsScrubberFocused] = useState(false);
  const isScrubberFocusedRef = useRef(false);

  // D-pad continuous hold-to-scrub refs
  const lastDpadTimeRef = useRef<number>(0);
  const lastDpadDirRef = useRef<'left' | 'right' | null>(null);
  const holdStartTimeRef = useRef<number>(0);
  const releaseDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrubPositionRef = useRef<number>(0);

  // Double-tap & single-tap gesture handling
  const lastTapTimeRef = useRef<number>(0);
  const [seekFlash, setSeekFlash] = useState<'left' | 'right' | null>(null);
  const seekFlashTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // HUD Controls visibility & idle auto-hide animation
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const controlsOpacity = useRef(new Animated.Value(1)).current;

  // Audio & Subtitles
  const [showTracksModal, setShowTracksModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<SettingsTab>('quality');
  const [audioTracks, setAudioTracks] = useState<AudioTrackOption[]>([]);
  const [subtitleTracks, setSubtitleTracks] = useState<SubtitleTrackOption[]>([]);
  const [selectedAudioIndex, setSelectedAudioIndex] = useState<number>(0);
  const [selectedSubtitleIndex, setSelectedSubtitleIndex] = useState<number>(-1);
  const [subtitleSize, setSubtitleSize] = useState<number>(16);
  const [subtitleOffset, setSubtitleOffset] = useState<number>(0);
  const [subtitleCues, setSubtitleCues] = useState<SubtitleCue[]>([]);

  // Curated clean quality options (480p, 720p, 1080p, 4K)
  const curatedQualities = useMemo(
    () => getCuratedQualitySources(availableSources),
    [availableSources]
  );

  // Auto-switch to preferred 720p stream if currently playing embed placeholder or 4K
  useEffect(() => {
    if (availableSources && availableSources.length > 0 && onSelectSource) {
      if (source.format === 'embed' || source.quality === '4K') {
        const preferred = getPreferred720pSource(availableSources);
        if (preferred && preferred.id !== source.id && preferred.quality !== '4K') {
          console.log('[PlayerScreen] Auto-switching to preferred 720p source:', preferred.name);
          onSelectSource(preferred);
        }
      }
    }
  }, [availableSources, source, onSelectSource]);

  const targetSeekTimeRef = useRef<number>(initialProgress);
  
  // Set initial seek time if it changed
  useEffect(() => {
    if (initialProgress > 0) {
      targetSeekTimeRef.current = initialProgress;
    }
  }, [initialProgress, media.id, season, episode]);

  const handleSelectQualitySource = useCallback(
    (newSource: StreamSource) => {
      targetSeekTimeRef.current = currentTimeRef.current;
      if (onSelectSource) {
        onSelectSource(newSource);
      }
    },
    [onSelectSource]
  );

  // Hide controls smoothly
  const hideControls = useCallback(() => {
    if (isScrubbingRef.current) return;
    if (showTracksModal || showSettingsModal || showEpisodesModal) return;

    Animated.timing(controlsOpacity, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setShowControls(false);
        setIsScrubberFocused(false);
        isScrubberFocusedRef.current = false;
      }
    });
  }, [showTracksModal, showSettingsModal, showEpisodesModal, controlsOpacity]);

  // Reset auto-hide timer for controls (called on user interaction / remote click)
  const resetControlsTimer = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = null;
    }
    setShowControls(true);
    Animated.timing(controlsOpacity, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();

    // Auto-hide when idle after 3.5 seconds
    if (!showTracksModal && !showSettingsModal && !showEpisodesModal && !isScrubbingRef.current) {
      controlsTimeoutRef.current = setTimeout(() => {
        hideControls();
      }, 3500);
    }
  }, [showTracksModal, showSettingsModal, showEpisodesModal, controlsOpacity, hideControls]);

  // Restart idle timer when modals close; keep controls visible when modals are open
  useEffect(() => {
    if (!showTracksModal && !showSettingsModal && !showEpisodesModal) {
      resetControlsTimer();
    } else {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = null;
      }
    }
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      if (releaseDebounceTimerRef.current) clearTimeout(releaseDebounceTimerRef.current);
    };
  }, [showTracksModal, showSettingsModal, showEpisodesModal, resetControlsTimer]);

  useEffect(() => {
    let isMounted = true;
    fetchSimilarMedia(media.id, media.type)
      .then(items => { if (isMounted) setRelatedItems(items); })
      .catch(() => { });
    return () => { isMounted = false; };
  }, [media.id, media.type]);

  // Sync selected season with prop
  useEffect(() => {
    if (season) setSelectedSeason(season);
  }, [season]);

  // Fetch TV seasons when media is a TV show
  useEffect(() => {
    if (media.type !== 'tv') return;
    let isMounted = true;
    fetchTVSeasons(media.id)
      .then(res => {
        if (isMounted) {
          setTvSeasons(res);
          setSelectedSeason(curr => {
            if (res.length > 0 && !res.some(s => s.seasonNumber === curr)) {
              return res[0].seasonNumber;
            }
            return curr;
          });
        }
      })
      .catch(() => { });
    return () => { isMounted = false; };
  }, [media.id, media.type]);

  // Fetch episodes for selectedSeason
  useEffect(() => {
    if (media.type !== 'tv' || !selectedSeason) return;
    let isMounted = true;
    setLoadingEpisodes(true);
    fetchTVEpisodes(media.id, selectedSeason)
      .then(res => {
        if (isMounted) {
          setTvEpisodes(res);
          setLoadingEpisodes(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoadingEpisodes(false);
      });
    return () => { isMounted = false; };
  }, [media.id, media.type, selectedSeason]);

  // IntroDB Segments State (Intro, Recap, Outro, Post-Credits)
  const [segments, setSegments] = useState<MediaSegments | null>(null);
  const [autoSkipIntro, setAutoSkipIntro] = useState<boolean>(false);
  const lastAutoSkippedKey = useRef<string | null>(null);

  // Dynamically fetch IntroDB segments for any Movie or TV/Anime series episode
  useEffect(() => {
    let isMounted = true;
    setSegments(null);
    lastAutoSkippedKey.current = null;

    const isEpisodic = media.type === 'tv' || media.type === 'anime';

    fetchIntroSegments({
      tmdbId: media.id,
      type: media.type,
      season: isEpisodic ? (season || selectedSeason || 1) : undefined,
      episode: isEpisodic ? (episode || 1) : undefined,
    })
      .then(res => {
        if (isMounted) {
          setSegments(res);
        }
      })
      .catch(err => {
        console.warn('[PlayerScreen] IntroDB fetch error:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [media.id, media.type, season, selectedSeason, episode]);

  // Realtime Active Segment Detection
  const currentSegment = useMemo(() => {
    if (!segments) return null;
    const cur = currentTime;
    const isEpisodic = media.type === 'tv' || media.type === 'anime';

    if (segments.recap && cur >= segments.recap.start_sec && cur < segments.recap.end_sec) {
      return { type: 'recap' as const, label: 'Skip Recap', segment: segments.recap };
    }
    if (segments.intro && cur >= segments.intro.start_sec && cur < segments.intro.end_sec) {
      return { type: 'intro' as const, label: 'Skip Intro', segment: segments.intro };
    }
    if (segments.outro && cur >= segments.outro.start_sec && cur < segments.outro.end_sec) {
      const hasNext = isEpisodic && tvEpisodes.some(e => e.episodeNumber === episode + 1);
      return {
        type: 'outro' as const,
        label: hasNext ? 'Next Episode' : 'Skip Outro',
        segment: segments.outro,
      };
    }
    if (segments.post_credits && cur >= segments.post_credits.start_sec && cur < segments.post_credits.end_sec) {
      return { type: 'post_credits' as const, label: 'Skip Credits', segment: segments.post_credits };
    }
    return null;
  }, [segments, currentTime, media.type, tvEpisodes, episode]);

  // Visual Timeline Markers on Seekbar
  const introMarkerStyle = useMemo(() => {
    if (!duration || !segments?.intro) return null;
    const left = (segments.intro.start_sec / duration) * 100;
    const width = ((segments.intro.end_sec - segments.intro.start_sec) / duration) * 100;
    if (left < 0 || width <= 0 || left > 100) return null;
    return {
      left: `${left}%`,
      width: `${Math.min(100 - left, width)}%`,
    };
  }, [duration, segments?.intro]);

  const recapMarkerStyle = useMemo(() => {
    if (!duration || !segments?.recap) return null;
    const left = (segments.recap.start_sec / duration) * 100;
    const width = ((segments.recap.end_sec - segments.recap.start_sec) / duration) * 100;
    if (left < 0 || width <= 0 || left > 100) return null;
    return {
      left: `${left}%`,
      width: `${Math.min(100 - left, width)}%`,
    };
  }, [duration, segments?.recap]);

  useEffect(() => {
    setErrorMessage(null);
    setIsLoading(true);
    setCurrentTime(0);
    setDuration(0);
    currentTimeRef.current = 0;
    durationRef.current = 0;
    if (source.subtitles && source.subtitles.length > 0) {
      setSubtitleTracks(source.subtitles.map((s, idx) => ({
        index: idx,
        title: s.title || s.language || ('Subtitle ' + (idx + 1)),
        language: s.language || 'und',
        uri: s.uri,
        type: s.type,
      })));
      setSelectedSubtitleIndex(0); // Automatically enable HDHub / OpenSubtitles CC by default
    } else {
      setSubtitleTracks([]);
      setSelectedSubtitleIndex(-1);
    }
  }, [source]);

  // Fetch and parse subtitle file whenever a CC subtitle track is selected
  useEffect(() => {
    if (selectedSubtitleIndex < 0 || !subtitleTracks[selectedSubtitleIndex]?.uri) {
      setSubtitleCues([]);
      return;
    }
    const uri = subtitleTracks[selectedSubtitleIndex].uri;
    if (!uri) return;
    let isMounted = true;
    fetch(uri)
      .then(res => res.text())
      .then(text => {
        if (isMounted) {
          const cues = parseSubtitles(text);
          setSubtitleCues(cues);
        }
      })
      .catch(err => {
        console.warn('Failed to parse subtitle stream:', err);
      });
    return () => { isMounted = false; };
  }, [selectedSubtitleIndex, subtitleTracks]);

  useEffect(() => {
    const onBackPress = () => {
      if (showEpisodesModal) { setShowEpisodesModal(false); return true; }
      if (showSettingsModal) { setShowSettingsModal(false); return true; }
      if (showTracksModal) { setShowTracksModal(false); return true; }
      if (showControls) {
        hideControls();
        return true;
      }
      if (isFullscreen) { toggleFullscreen(); return true; }
      handleClosePlayer();
      return true;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [showEpisodesModal, showSettingsModal, showTracksModal, showControls, isFullscreen, toggleFullscreen, handleClosePlayer, hideControls]);

  // Flash indicator for 10s seek
  const triggerSeekFlash = (dir: 'left' | 'right') => {
    if (seekFlashTimeout.current) clearTimeout(seekFlashTimeout.current);
    setSeekFlash(dir);
    seekFlashTimeout.current = setTimeout(() => setSeekFlash(null), 700);
  };

  // UNIFIED SEEK FUNCTION (Works for both Native & Embed)
  const handleSeek = useCallback((seconds: number) => {
    const cur = currentTimeRef.current || currentTime;
    const dur = durationRef.current || duration;
    let target = cur + seconds;
    if (target < 0) target = 0;
    if (dur > 0 && target > dur) target = dur;

    // Lock incoming onProgress updates for 1s so ExoPlayer has time to buffer & seek smoothly
    seekLockUntilRef.current = Date.now() + 1000;
    currentTimeRef.current = target;
    setCurrentTime(target);

    if (isEmbed) {
      const js = `
        (function() {
          try {
            var v = document.querySelector('video');
            if (v) { v.currentTime = ${target}; }
            var frames = document.querySelectorAll('iframe');
            for (var i = 0; i < frames.length; i++) {
              try {
                frames[i].contentWindow.postMessage({ type: 'SEEK', time: ${target} }, '*');
                var fv = frames[i].contentWindow.document.querySelector('video');
                if (fv) { fv.currentTime = ${target}; }
              } catch(e) {}
            }
          } catch(e) {}
        })();
        true;
      `;
      webViewRef.current?.injectJavaScript(js);
    } else {
      console.log('[PlayerScreen] Executing Native Video seek:', target, 'seconds');
      videoRef.current?.seek(target);
    }

    resetControlsTimer();
  }, [isEmbed, currentTime, duration, resetControlsTimer]);

  // UNIFIED ABSOLUTE SEEK (From progress scrubber)
  const handleSeekTo = useCallback((targetTime: number) => {
    const dur = durationRef.current || duration;
    let t = Math.max(0, targetTime);
    if (dur > 0 && t > dur) t = dur;

    // Lock incoming onProgress updates for 1s
    seekLockUntilRef.current = Date.now() + 1000;
    currentTimeRef.current = t;
    setCurrentTime(t);

    if (isEmbed) {
      const js = `
        (function() {
          try {
            var v = document.querySelector('video');
            if (v) { v.currentTime = ${t}; }
            var frames = document.querySelectorAll('iframe');
            for (var i = 0; i < frames.length; i++) {
              try {
                frames[i].contentWindow.postMessage({ type: 'SEEK', time: ${t} }, '*');
                var fv = frames[i].contentWindow.document.querySelector('video');
                if (fv) { fv.currentTime = ${t}; }
              } catch(e) {}
            }
          } catch(e) {}
        })();
        true;
      `;
      webViewRef.current?.injectJavaScript(js);
    } else {
      console.log('[PlayerScreen] Executing Native Video seekTo:', t, 'seconds');
      videoRef.current?.seek(t);
    }

    resetControlsTimer();
  }, [isEmbed, duration, resetControlsTimer]);

  // Touch and Drag position calculation on the scrubber track
  const calculateScrubberTime = useCallback((evt: any) => {
    const dur = durationRef.current || duration;
    const w = trackWidthRef.current || trackWidth || Math.max(100, screenWidth - 100);
    if (dur <= 0 || w <= 0) return 0;
    let x = evt.nativeEvent.locationX;
    if (trackLeftRef.current > 0 && typeof evt.nativeEvent.pageX === 'number') {
      x = evt.nativeEvent.pageX - trackLeftRef.current;
    }
    const ratio = Math.max(0, Math.min(1, x / w));
    return ratio * dur;
  }, [duration, trackWidth, screenWidth]);

  const handleScrubberGrant = useCallback((evt: any) => {
    isScrubbingRef.current = true;
    const t = calculateScrubberTime(evt);
    setScrubbingTime(t);
    resetControlsTimer();
  }, [calculateScrubberTime, resetControlsTimer]);

  const handleScrubberMove = useCallback((evt: any) => {
    const t = calculateScrubberTime(evt);
    setScrubbingTime(t);
  }, [calculateScrubberTime]);

  const handleScrubberRelease = useCallback((evt: any) => {
    isScrubbingRef.current = false;
    const t = calculateScrubberTime(evt);
    setScrubbingTime(null);
    handleSeekTo(t);
    resetControlsTimer();
  }, [calculateScrubberTime, handleSeekTo, resetControlsTimer]);

  const handleScrubberTerminate = useCallback(() => {
    isScrubbingRef.current = false;
    setScrubbingTime(null);
    resetControlsTimer();
  }, [resetControlsTimer]);

  // Commit any in-progress D-pad scrubber hold
  const commitScrub = useCallback(() => {
    if (releaseDebounceTimerRef.current) {
      clearTimeout(releaseDebounceTimerRef.current);
      releaseDebounceTimerRef.current = null;
    }
    if (isScrubbingRef.current) {
      isScrubbingRef.current = false;
      const target = scrubPositionRef.current;
      setScrubbingTime(null);
      handleSeekTo(target);
    }
    lastDpadDirRef.current = null;
  }, [handleSeekTo]);

  // Handle D-pad Left / Right with click-to-seek and smooth continuous hold-to-scrub
  const handleScrubberDpad = useCallback(
    (dir: 'left' | 'right') => {
      const now = Date.now();
      const isSameDir = lastDpadDirRef.current === dir;
      const timeSinceLast = now - lastDpadTimeRef.current;
      lastDpadTimeRef.current = now;
      resetControlsTimer();

      const dur = durationRef.current || duration || 7200;

      // Detect hold / rapid repeat from TV remote (interval < 350ms)
      if (isSameDir && timeSinceLast < 350) {
        if (!isScrubbingRef.current) {
          isScrubbingRef.current = true;
          holdStartTimeRef.current = now - timeSinceLast;
          scrubPositionRef.current = currentTimeRef.current || currentTime;
        }

        const holdDuration = now - holdStartTimeRef.current;
        // Accelerate smoothly as button is held down:
        // Initial 600ms: ~0.5% of duration per tick (min 10s)
        // 600ms - 1500ms: ~1.5% of duration per tick (min 25s)
        // > 1500ms: ~3.5% of duration per tick (min 60s)
        let step = Math.max(10, dur * 0.005);
        if (holdDuration > 1500) {
          step = Math.max(60, dur * 0.035);
        } else if (holdDuration > 600) {
          step = Math.max(25, dur * 0.015);
        }

        let nextTime = scrubPositionRef.current + (dir === 'right' ? step : -step);
        if (nextTime < 0) nextTime = 0;
        if (dur > 0 && nextTime > dur) nextTime = dur;

        scrubPositionRef.current = nextTime;
        setScrubbingTime(nextTime);

        // Schedule commit when user releases the button
        if (releaseDebounceTimerRef.current) {
          clearTimeout(releaseDebounceTimerRef.current);
        }
        releaseDebounceTimerRef.current = setTimeout(() => {
          commitScrub();
          triggerSeekFlash(dir);
        }, 360);
      } else {
        // Single click (or initial press)
        if (releaseDebounceTimerRef.current) {
          clearTimeout(releaseDebounceTimerRef.current);
          releaseDebounceTimerRef.current = null;
        }
        lastDpadDirRef.current = dir;
        holdStartTimeRef.current = now;
        scrubPositionRef.current = (currentTimeRef.current || currentTime) + (dir === 'right' ? 10 : -10);
        if (scrubPositionRef.current < 0) scrubPositionRef.current = 0;
        if (dur > 0 && scrubPositionRef.current > dur) scrubPositionRef.current = dur;

        handleSeek(dir === 'right' ? 10 : -10);
        triggerSeekFlash(dir);

        // Clear direction if no repeat occurs within 360ms
        releaseDebounceTimerRef.current = setTimeout(() => {
          lastDpadDirRef.current = null;
        }, 360);
      }
    },
    [duration, currentTime, resetControlsTimer, commitScrub, handleSeek]
  );

  // Skip Current Detected Segment (Intro, Recap, Outro, Credits)
  const handleSkipCurrentSegment = useCallback(() => {
    if (!currentSegment) return;
    if (currentSegment.type === 'outro' && media.type === 'tv') {
      const nextEp = tvEpisodes.find(e => e.episodeNumber === episode + 1);
      if (nextEp && onSelectEpisode) {
        onSelectEpisode(season, nextEp.episodeNumber, nextEp);
        return;
      }
    }
    handleSeekTo(currentSegment.segment.end_sec + 0.5);
  }, [currentSegment, media.type, tvEpisodes, episode, season, onSelectEpisode, handleSeekTo]);

  // Auto-skip handler when enabled
  useEffect(() => {
    if (!autoSkipIntro || !currentSegment) return;
    const key = `${currentSegment.type}_${currentSegment.segment.start_sec}`;
    if (lastAutoSkippedKey.current === key) return;

    if (currentSegment.type === 'intro' || currentSegment.type === 'recap') {
      lastAutoSkippedKey.current = key;
      handleSeekTo(currentSegment.segment.end_sec + 0.5);
    }
  }, [autoSkipIntro, currentSegment, handleSeekTo]);

  // UNIFIED PLAY/PAUSE
  const handleTogglePlay = useCallback(() => {
    const nextPaused = !paused;
    setPaused(nextPaused);

    if (isEmbed) {
      const js = `
        (function() {
          try {
            var v = document.querySelector('video');
            if (!v) {
              var frames = document.querySelectorAll('iframe');
              for (var i = 0; i < frames.length; i++) {
                try {
                  var fv = frames[i].contentWindow.document.querySelector('video');
                  if (fv) { v = fv; break; }
                } catch(e) {}
              }
            }
            if (v) {
              if (${nextPaused}) v.pause();
              else v.play();
            }
          } catch(e) {}
        })();
        true;
      `;
      webViewRef.current?.injectJavaScript(js);
    }
    resetControlsTimer();
  }, [isEmbed, paused, resetControlsTimer]);

  // Screen Tap / Double Tap handler
  const handleScreenTouch = (evt?: any) => {
    const now = Date.now();
    const x = evt?.nativeEvent?.locationX ?? screenWidth / 2;
    const isDoubleTap = now - lastTapTimeRef.current < 350;
    lastTapTimeRef.current = now;

    if (isDoubleTap) {
      if (x < screenWidth / 2) {
        handleSeek(-10);
        triggerSeekFlash('left');
      } else {
        handleSeek(10);
        triggerSeekFlash('right');
      }
      resetControlsTimer();
    } else {
      if (showControls) {
        hideControls();
      } else {
        resetControlsTimer();
      }
    }
  };

  // Listen to Hardware Key Events on Android TV (D-pad & Media keys)
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('onHWKeyEvent', (e: { eventType: string; keyCode?: number }) => {
      const { eventType, keyCode } = e || {};
      // Ignore native focus / blur events completely
      if (!eventType || eventType === 'focus' || eventType === 'blur') {
        return;
      }

      console.log('[PlayerHWKey]', eventType, keyCode, 'showControls:', showControls, 'isScrubber:', isScrubberFocusedRef.current);

      if (showTracksModal || showSettingsModal || showEpisodesModal) return;

      if (eventType === 'playPause' || keyCode === 85 || keyCode === 126 || keyCode === 127) {
        handleTogglePlay();
        resetControlsTimer();
        return;
      }
      if (eventType === 'fastForward') {
        handleSeek(10);
        triggerSeekFlash('right');
        resetControlsTimer();
        return;
      }
      if (eventType === 'rewind') {
        handleSeek(-10);
        triggerSeekFlash('left');
        resetControlsTimer();
        return;
      }

      const isDirectionalOrSelect = ['up', 'down', 'left', 'right', 'select', 'center'].includes(eventType);
      if (!isDirectionalOrSelect) {
        return;
      }

      if (!showControls) {
        if (eventType === 'select' || eventType === 'center') {
          handleTogglePlay();
        } else if (eventType === 'left') {
          handleSeek(-10);
          triggerSeekFlash('left');
        } else if (eventType === 'right') {
          handleSeek(10);
          triggerSeekFlash('right');
        }
        resetControlsTimer();
        return;
      }

      // HUD Controls are VISIBLE
      if (isScrubberFocusedRef.current) {
        if (eventType === 'left') {
          handleScrubberDpad('left');
          return;
        }
        if (eventType === 'right') {
          handleScrubberDpad('right');
          return;
        }
        if (eventType === 'up') {
          if (isScrubbingRef.current) {
            commitScrub();
          }
          setIsScrubberFocused(false);
          isScrubberFocusedRef.current = false;
          playPauseRef.current?.focus?.();
          resetControlsTimer();
          return;
        }
        if (eventType === 'select' || eventType === 'center' || keyCode === 23 || keyCode === 66) {
          if (isScrubbingRef.current) {
            commitScrub();
          } else {
            handleTogglePlay();
          }
          resetControlsTimer();
          return;
        }
      } else {
        // When center controls or other elements are focused, Down navigates to the scrubber
        if (eventType === 'down') {
          setIsScrubberFocused(true);
          isScrubberFocusedRef.current = true;
          scrubberFocusRef.current?.focus?.();
          resetControlsTimer();
          return;
        }
      }

      resetControlsTimer();
    });
    return () => sub.remove();
  }, [
    showControls,
    showTracksModal,
    showSettingsModal,
    showEpisodesModal,
    handleTogglePlay,
    handleSeek,
    handleScrubberDpad,
    commitScrub,
    resetControlsTimer,
  ]);

  // Video Load / Progress handlers (Native)
  const handleLoad = useCallback((data: OnLoadData) => {
    setIsLoading(false);
    setErrorMessage(null);
    const d = data.duration || 0;
    durationRef.current = d;
    setDuration(d);
    if (targetSeekTimeRef.current > 0) {
      const resumeT = targetSeekTimeRef.current;
      targetSeekTimeRef.current = 0;
      setTimeout(() => {
        videoRef.current?.seek(resumeT);
      }, 100);
    }
    if (data.audioTracks?.length) {
      setAudioTracks(data.audioTracks.map((t, idx) => ({ index: t.index ?? idx, title: t.title || 'Audio ' + (idx + 1), language: t.language || 'und' })));
    }
    if (data.textTracks?.length) {
      setSubtitleTracks(data.textTracks.map((t, idx) => ({ index: t.index ?? idx, title: t.title || 'Subtitle ' + (idx + 1), language: t.language || 'und' })));
    }
  }, []);

  const handleAudioTracks = useCallback((data: { audioTracks: AudioTrack[] }) => {
    if (data.audioTracks?.length) {
      setAudioTracks(data.audioTracks.map((t, idx) => ({ index: t.index ?? idx, title: t.title || 'Audio ' + (idx + 1), language: t.language || 'und' })));
    }
  }, []);

  const handleTextTracks = useCallback((data: { textTracks: TextTrack[] }) => {
    if (data.textTracks?.length) {
      setSubtitleTracks(data.textTracks.map((t, idx) => ({ index: t.index ?? idx, title: t.title || 'Subtitle ' + (idx + 1), language: t.language || 'und' })));
    }
  }, []);

  const handleProgress = useCallback((data: OnProgressData) => {
    if (isScrubbingRef.current) return;
    if (Date.now() < seekLockUntilRef.current) return;
    currentTimeRef.current = data.currentTime;
    setCurrentTime(data.currentTime);
    if (isLoading) setIsLoading(false);
  }, [isLoading]);

  // Reset loading and error states when source changes
  useEffect(() => {
    setIsLoading(true);
    setErrorMessage(null);
  }, [source.id, source.url]);

  const handleError = useCallback((err: any) => {
    console.warn('Native Video Error:', err);
    setIsLoading(false);

    // Auto-fallback: prioritize preferred 720p native stream or fallback to embed (NEVER pick 4K)
    const otherSources = availableSources.filter(s => s.id !== source.id);
    const fallback = getPreferred720pSource(otherSources) || otherSources.find(s => s.format === 'embed');

    if (fallback && onSelectSource) {
      console.log('Stream playback failed, auto-falling back to:', fallback.name);
      onSelectSource(fallback);
      setErrorMessage(null);
      setIsLoading(true);
    } else {
      setErrorMessage('Failed to connect to stream.');
    }
  }, [availableSources, source.id, onSelectSource]);

  // UNIFIED PLAYBACK SPEED
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);

  // UNIFIED MUTE / UNMUTE
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const handleToggleMute = useCallback(() => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    if (isEmbed) {
      const js = `
        (function() {
          try {
            var v = document.querySelector('video');
            if (!v) {
              var frames = document.querySelectorAll('iframe');
              for (var i = 0; i < frames.length; i++) {
                try {
                  var fv = frames[i].contentWindow.document.querySelector('video');
                  if (fv) { v = fv; break; }
                } catch(e) {}
              }
            }
            if (v) { v.muted = ${nextMuted}; }
          } catch(e) {}
        })();
        true;
      `;
      webViewRef.current?.injectJavaScript(js);
    }
    resetControlsTimer();
  }, [isEmbed, isMuted, resetControlsTimer]);

  // UNIFIED ASPECT RATIO / RESIZE MODE
  const [resizeMode, setResizeMode] = useState<ResizeMode>(ResizeMode.CONTAIN);

  // SUBTITLE TRACK SELECTOR
  const handleSelectSubtitle = useCallback((idx: number) => {
    setSelectedSubtitleIndex(idx);
    setShowTracksModal(false);

    if (isEmbed) {
      const js = `
        (function() {
          try {
            var v = document.querySelector('video');
            if (!v) {
              var frames = document.querySelectorAll('iframe');
              for (var i = 0; i < frames.length; i++) {
                try {
                  var fv = frames[i].contentWindow.document.querySelector('video');
                  if (fv) { v = fv; break; }
                } catch(e) {}
              }
            }
            if (v && v.textTracks) {
              for (var i = 0; i < v.textTracks.length; i++) {
                v.textTracks[i].mode = (i === ${idx}) ? 'showing' : 'disabled';
              }
            }
          } catch(e) {}
        })();
        true;
      `;
      webViewRef.current?.injectJavaScript(js);
    }
  }, [isEmbed]);

  // WebView message listener for Embed video sync
  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'WEB_USER_ACTIVITY') {
        resetControlsTimer();
      } else if (data.type === 'FULLSCREEN_CHANGE') {
        if (typeof data.isFullscreen === 'boolean') {
          setIsFullscreen(data.isFullscreen);
        }
      } else if (data.type === 'VIDEO_STATE') {
        if (typeof data.currentTime === 'number') {
          currentTimeRef.current = data.currentTime;
          setCurrentTime(data.currentTime);
        }
        if (typeof data.duration === 'number' && data.duration > 0) {
          durationRef.current = data.duration;
          setDuration(data.duration);
        }
        if (typeof data.paused === 'boolean') {
          setPaused(data.paused);
        }
        if (typeof data.muted === 'boolean') {
          setIsMuted(data.muted);
        }
        if (typeof data.playbackRate === 'number' && data.playbackRate > 0) {
          setPlaybackSpeed(data.playbackRate);
        }
        if (Array.isArray(data.tracks) && data.tracks.length > 0) {
          setSubtitleTracks(data.tracks.map((t: any, idx: number) => ({
            index: t.index ?? idx,
            title: t.title || 'Subtitle ' + (idx + 1),
            language: t.language || 'und',
          })));
        }
        if (isLoading) setIsLoading(false);
      }
    } catch { }
  };

  const handleShouldStartLoad = (request: any) => {
    const url: string = request.url || '';
    // Always allow subframe / iframe / internal stream requests so embedded player components and APIs load cleanly
    if (request.isTopFrame === false) {
      return true;
    }
    // Allow empty, blank, blob, data, and initial source url
    if (!url || url === 'about:blank' || url.startsWith('blob:') || url.startsWith('data:') || url === source.url) {
      return true;
    }
    const isMedia = /\.(mp4|m3u8|mkv|avi|mov|ts|webm)(\?|$)/i.test(url);
    if (isMedia) return true;

    const isAllowedStreamDomain =
      url.includes('vidlink.pro') ||
      url.includes('vidsrc') ||
      url.includes('moviesapi') ||
      url.includes('multiembed') ||
      url.includes('autoembed.co') ||
      url.includes('2embed') ||
      url.includes('vidfast.vc') ||
      url.includes('vidlux.xyz') ||
      url.includes('hexa.su') ||
      url.includes('vidrock.net') ||
      url.includes('vidup.to') ||
      url.includes('vidnest.fun') ||
      url.includes('vidcore.io') ||
      url.includes('vidzee.wtf') ||
      url.includes('vidora.su') ||
      url.includes('vidlove.cc') ||
      url.includes('peachify.top') ||
      url.includes('mapple.uk') ||
      url.includes('vixsrc.to') ||
      url.includes('rabbitstream') ||
      url.includes('megacloud') ||
      url.includes('dokicloud') ||
      url.includes('streamwish') ||
      url.includes('fastream') ||
      url.includes('smashystream');

    if (isAllowedStreamDomain) return true;

    // Block top-level window redirects to unknown ad landing pages
    return false;
  };

  const externalTextTracks = useMemo(() => {
    if (!source.subtitles?.length) return undefined;
    return source.subtitles.map(s => ({
      title: s.title,
      language: s.language as any,
      type: (s.type === 'application/x-subrip' ? TextTrackType.SUBRIP : TextTrackType.VTT) as TextTrackType,
      uri: s.uri,
    }));
  }, [source.subtitles]);



  const formatCountdown = (secs: number) => {
    const t = Math.floor(Math.max(0, secs));
    const h = Math.floor(t / 3600);
    const m = Math.floor((t % 3600) / 60);
    const s = t % 60;
    const pad = (n: number) => (n < 10 ? '0' : '') + n;
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };

  const formatElapsed = (secs: number) => {
    const t = Math.floor(Math.max(0, secs));
    const h = Math.floor(t / 3600);
    const m = Math.floor((t % 3600) / 60);
    const s = t % 60;
    const pad = (n: number) => (n < 10 ? '0' : '') + n;
    if (h > 0) {
      return `${pad(h)}:${pad(m)}:${pad(s)}`;
    }
    return `${pad(m)}:${pad(s)}`;
  };

  const curSec = scrubbingTime !== null ? scrubbingTime : (currentTimeRef.current || currentTime);
  const durSec = durationRef.current || duration;
  const progressPercent = durSec > 0 ? Math.min(Math.max(0, (curSec / durSec) * 100), 100) : 0;

  const handleToggleCC = useCallback(() => {
    if (selectedSubtitleIndex >= 0) {
      setSelectedSubtitleIndex(-1);
    } else if (subtitleTracks.length > 0) {
      setSelectedSubtitleIndex(0);
    } else {
      setShowSettingsModal(true);
    }
  }, [selectedSubtitleIndex, subtitleTracks]);

  const currentCueText = useMemo(() => {
    if (selectedSubtitleIndex < 0 || subtitleCues.length === 0) return '';
    const adjustedTime = curSec + subtitleOffset;
    const cue = subtitleCues.find(c => c.start <= adjustedTime && adjustedTime <= c.end);
    return cue ? cue.text : '';
  }, [selectedSubtitleIndex, subtitleCues, curSec, subtitleOffset]);

  const videoViewStyle = effectiveFullscreen
    ? styles.videoViewportFullscreen
    : [
      styles.videoViewportPortrait,
      {
        width: screenWidth,
        height: Math.round(screenWidth * (9 / 16)),
      },
    ];

  const safeTop = Math.max(topInset || 0, StatusBar.currentHeight || 0);

  return (
    <View style={[styles.container, !effectiveFullscreen && !isTV && { paddingTop: safeTop }]}>
      <StatusBar
        hidden={effectiveFullscreen}
        barStyle="light-content"
      />

      {/* ── VIDEO VIEWPORT ── */}
      <View style={videoViewStyle}>

        {/* 1. Underlying Video Engine (Native or Embed) */}
        {isEmbed ? (
          <View style={StyleSheet.absoluteFill}>
            <NativeWebView
              ref={webViewRef}
              source={{ uri: source.url }}
              style={StyleSheet.absoluteFill}
              javaScriptEnabled
              domStorageEnabled
              allowsFullscreenVideo
              mediaPlaybackRequiresUserAction={false}
              originWhitelist={['*']}
              mixedContentMode="always"
              allowsInlineMediaPlayback
              setSupportMultipleWindows={false}
              userAgent="Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
              injectedJavaScriptBeforeContentLoaded={INJECTED_WEB_SYNC}
              onMessage={handleWebViewMessage}
              onLoadStart={() => setIsLoading(true)}
              onLoadEnd={() => setIsLoading(false)}
              onError={() => { setIsLoading(false); setErrorMessage('Failed to load stream.'); }}
              onShouldStartLoadWithRequest={handleShouldStartLoad}
            />
          </View>
        ) : (
          <View style={StyleSheet.absoluteFill}>
            <Video
              ref={videoRef}
              source={{
                uri: source.url,
                headers: source.headers || {
                  'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                },
              }}
              style={StyleSheet.absoluteFill}
              resizeMode={resizeMode}
              useTextureView={true}
              viewType={ViewType.TEXTURE}
              playInBackground={false}
              playWhenInactive={false}
              ignoreSilentSwitch="ignore"
              rate={playbackSpeed}
              muted={isMuted}
              paused={paused}
              progressUpdateInterval={250}
              onLoad={handleLoad}
              onProgress={handleProgress}
              onSeek={(data) => {
                seekLockUntilRef.current = 0;
                if (!isScrubbingRef.current) {
                  currentTimeRef.current = data.currentTime;
                  setCurrentTime(data.currentTime);
                }
              }}
              onAudioTracks={handleAudioTracks}
              onTextTracks={handleTextTracks}
              selectedAudioTrack={selectedAudioIndex >= 0 ? { type: SelectedTrackType.INDEX, value: selectedAudioIndex } : undefined}
              selectedTextTrack={selectedSubtitleIndex >= 0 ? { type: SelectedTrackType.INDEX, value: selectedSubtitleIndex } : { type: SelectedTrackType.DISABLED }}
              textTracks={externalTextTracks}
              onBuffer={({ isBuffering }) => { if (!errorMessage) setIsLoading(isBuffering); }}
              onError={handleError}
            />
          </View>
        )}

        {/* 2. Transparent Full-Screen TV Remote Wakeup & Touch Gesture Layer */}
        {!showControls ? (
          <TVFocusable
            hasTVPreferredFocus={!showControls}
            scaleOnFocus={false}
            style={StyleSheet.absoluteFill}
            focusRingStyle={{ borderWidth: 0 }}
            onPress={resetControlsTimer}
            onPressUp={resetControlsTimer}
            onPressDown={resetControlsTimer}
            onPressLeft={() => {
              handleSeek(-10);
              triggerSeekFlash('left');
              resetControlsTimer();
            }}
            onPressRight={() => {
              handleSeek(10);
              triggerSeekFlash('right');
              resetControlsTimer();
            }}
            onKeyDown={e => {
              const key = e.nativeEvent?.key || e.nativeEvent?.code || '';
              const keyCode = e.nativeEvent?.keyCode;
              if (keyCode === 85 || keyCode === 126 || keyCode === 127 || key === 'MediaPlayPause' || key === 'Space') {
                handleTogglePlay();
              }
              resetControlsTimer();
            }}
          />
        ) : (
          <TouchableWithoutFeedback onPress={handleScreenTouch}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
        )}

        {/* 3. Closed Captions (CC) Subtitle Overlay */}
        {selectedSubtitleIndex >= 0 && Boolean(currentCueText) && (
          <View style={styles.subtitleOverlay} pointerEvents="none">
            <View style={styles.subtitleTextBg}>
              <Text style={[styles.subtitleText, { fontSize: isTV ? Math.max(22, subtitleSize + 6) : subtitleSize }]}>
                {currentCueText}
              </Text>
            </View>
          </View>
        )}

        {/* 4. Seek Flash Feedback Overlay */}
        {seekFlash === 'left' && (
          <View style={[styles.seekFlash, { left: 0 }]} pointerEvents="none">
            <Text style={styles.seekFlashText}>‹‹ 10s</Text>
          </View>
        )}
        {seekFlash === 'right' && (
          <View style={[styles.seekFlash, { right: 0 }]} pointerEvents="none">
            <Text style={styles.seekFlashText}>10s ››</Text>
          </View>
        )}

        {/* 4.5. Smart Floating Skip Segment Button (IntroDB) */}
        {currentSegment && (
          <View
            style={[
              styles.skipButtonContainer,
              isTV && styles.skipButtonContainerTV,
              { bottom: isTV ? 88 : (effectiveFullscreen ? 75 : 54) },
            ]}
            pointerEvents="box-none">
            <TVFocusable
              hasTVPreferredFocus={false}
              scaleOnFocus
              style={[styles.skipBtn, isTV && styles.skipBtnTV]}
              focusedStyle={styles.skipBtnFocused}
              activeOpacity={0.8}
              onFocus={resetControlsTimer}
              onPressDown={() => scrubberFocusRef.current?.focus?.()}
              onPressUp={() => playPauseRef.current?.focus?.()}
              onPress={handleSkipCurrentSegment}>
              <View style={styles.skipBtnContent}>
                <Text style={[styles.skipBtnText, isTV && styles.skipBtnTextTV]}>
                  {currentSegment.label}
                </Text>
                <Text style={styles.skipBtnArrow}>›</Text>
              </View>
            </TVFocusable>
          </View>
        )}

        {/* 5. UNIFIED CONTROLS HUD (Rendered for BOTH Embed & Native) */}
        {showControls && (
          <Animated.View style={[StyleSheet.absoluteFill, { zIndex: 60, opacity: controlsOpacity }]} pointerEvents="box-none">

            {/* Top Bar: Back Button (Left) + Action Icons (Right) */}
            <View
              style={[
                styles.topBar,
                isTV && styles.topBarTV,
                {
                  top: isTV ? 20 : (effectiveFullscreen ? (StatusBar.currentHeight || 16) : 12),
                },
              ]}
              pointerEvents="box-none">
              {/* Back Button */}
              <TVFocusable
                style={[styles.plainIconBtn, isTV && styles.plainIconBtnTV]}
                focusedStyle={styles.plainIconBtnFocused}
                activeOpacity={0.7}
                onFocus={resetControlsTimer}
                onPress={() => { if (isFullscreen) toggleFullscreen(); else handleClosePlayer(); }}>
                <BackIcon color="#FFFFFF" size={isTV ? 24 : 20} />
              </TVFocusable>

              {/* Right-side action icons */}
              <View style={styles.topRightActions} pointerEvents="box-none">
                {/* Quality pill */}
                <TVFocusable
                  style={[styles.qualityPillBtn, isTV && styles.qualityPillBtnTV]}
                  focusedStyle={styles.plainIconBtnFocused}
                  activeOpacity={0.7}
                  onFocus={resetControlsTimer}
                  onPress={() => {
                    setSettingsInitialTab('quality');
                    setShowSettingsModal(true);
                  }}>
                  <Text style={[styles.qualityPillText, isTV && styles.qualityPillTextTV]}>
                    {source.quality || 'HD'}
                  </Text>
                </TVFocusable>

                {/* CC Quick Toggle */}
                <TVFocusable
                  style={[styles.plainIconBtn, isTV && styles.plainIconBtnTV, selectedSubtitleIndex >= 0 && styles.plainIconBtnActive]}
                  focusedStyle={styles.plainIconBtnFocused}
                  activeOpacity={0.7}
                  onFocus={resetControlsTimer}
                  onPress={handleToggleCC}>
                  <CCIcon color={selectedSubtitleIndex >= 0 ? '#4ADE80' : '#FFFFFF'} size={isTV ? 22 : 18} />
                </TVFocusable>

                {/* Episodes button (TV series only) */}
                {media.type === 'tv' && (
                  <TVFocusable
                    style={[styles.plainIconBtn, isTV && styles.plainIconBtnTV]}
                    focusedStyle={styles.plainIconBtnFocused}
                    activeOpacity={0.7}
                    onFocus={resetControlsTimer}
                    onPress={() => setShowEpisodesModal(true)}>
                    <EpisodesIcon color="#FFFFFF" size={isTV ? 22 : 18} />
                  </TVFocusable>
                )}

                {/* Settings */}
                <TVFocusable
                  style={[styles.plainIconBtn, isTV && styles.plainIconBtnTV]}
                  focusedStyle={styles.plainIconBtnFocused}
                  activeOpacity={0.7}
                  onFocus={resetControlsTimer}
                  onPress={() => {
                    setSettingsInitialTab('subtitles');
                    setShowSettingsModal(true);
                  }}>
                  <SettingsIcon color="#FFFFFF" size={isTV ? 22 : 18} />
                </TVFocusable>
              </View>
            </View>

            {/* Center Playback Controls (Rewind | Play/Pause | Forward) */}
            <View style={[styles.centerControls, isTV && { gap: 44 }]} pointerEvents="box-none">
              {/* Rewind 10s */}
              <TVFocusable
                style={[styles.plainIconBtnLarge, isTV && styles.plainIconBtnLargeTV]}
                focusedStyle={styles.plainIconBtnFocused}
                activeOpacity={0.7}
                onFocus={resetControlsTimer}
                onPressDown={() => {
                  playPauseRef.current?.blur?.();
                  scrubberFocusRef.current?.focus?.();
                }}
                onPress={() => {
                  handleSeek(-10);
                  triggerSeekFlash('left');
                  resetControlsTimer();
                }}>
                <Replay10Icon color="#FFFFFF" size={isTV ? 42 : 36} />
              </TVFocusable>

              {/* Play / Pause (circular glass button) */}
              <TVFocusable
                ref={playPauseRef}
                style={[styles.glassBtnLarge, isTV && styles.glassBtnLargeTV]}
                focusedStyle={styles.glassBtnFocused}
                activeOpacity={0.7}
                hasTVPreferredFocus={showControls && !isScrubberFocused}
                onFocus={() => {
                  setIsScrubberFocused(false);
                  isScrubberFocusedRef.current = false;
                  resetControlsTimer();
                }}
                onPressDown={() => {
                  playPauseRef.current?.blur?.();
                  scrubberFocusRef.current?.focus?.();
                }}
                onPress={handleTogglePlay}>
                {paused ? <PlayIcon color="#FFFFFF" size={isTV ? 30 : 26} /> : <PauseIcon color="#FFFFFF" size={isTV ? 28 : 24} />}
              </TVFocusable>

              {/* Forward 10s */}
              <TVFocusable
                style={[styles.plainIconBtnLarge, isTV && styles.plainIconBtnLargeTV]}
                focusedStyle={styles.plainIconBtnFocused}
                activeOpacity={0.7}
                onFocus={resetControlsTimer}
                onPressDown={() => {
                  playPauseRef.current?.blur?.();
                  scrubberFocusRef.current?.focus?.();
                }}
                onPress={() => {
                  handleSeek(10);
                  triggerSeekFlash('right');
                  resetControlsTimer();
                }}>
                <Forward10Icon color="#FFFFFF" size={isTV ? 42 : 36} />
              </TVFocusable>
            </View>

            {/* Bottom Timeline Bar */}
            <View
              pointerEvents="box-none"
              style={[
                styles.bottomBar,
                isTV
                  ? styles.bottomBarTV
                  : effectiveFullscreen
                    ? styles.bottomBarLandscape
                    : styles.bottomBarPortrait,
              ]}>
              {/* Row above progress slider containing Fullscreen Toggle (Right-aligned) */}
              {!isTV && (
                <View style={styles.aboveSliderRow} pointerEvents="box-none">
                  <TVFocusable
                    style={styles.plainIconBtn}
                    focusedStyle={styles.plainIconBtnFocused}
                    activeOpacity={0.7}
                    onFocus={resetControlsTimer}
                    onPress={toggleFullscreen}>
                    {isFullscreen
                      ? <ExitFullscreenIcon color="#FFFFFF" size={19} />
                      : <FullscreenIcon color="#FFFFFF" size={19} />}
                  </TVFocusable>
                </View>
              )}

              {/* Progress Slider Row */}
              <View style={styles.sliderRow} pointerEvents="box-none">
                {/* Interactive TV Focusable Scrubber Track */}
                <TVFocusable
                  ref={scrubberFocusRef}
                  style={styles.progressTrackWrap}
                  scaleOnFocus={false}
                  focusRingStyle={{ borderWidth: 0 }}
                  hasTVPreferredFocus={showControls && isScrubberFocused}
                  onFocus={() => {
                    setIsScrubberFocused(true);
                    isScrubberFocusedRef.current = true;
                    resetControlsTimer();
                  }}
                  onBlur={() => {
                    if (!isScrubbingRef.current) {
                      setIsScrubberFocused(false);
                      isScrubberFocusedRef.current = false;
                    }
                  }}
                  onPress={() => {
                    if (isScrubbingRef.current) {
                      commitScrub();
                    } else {
                      handleTogglePlay();
                    }
                  }}
                  onPressUp={() => {
                    if (isScrubbingRef.current) {
                      commitScrub();
                    }
                    setIsScrubberFocused(false);
                    isScrubberFocusedRef.current = false;
                    playPauseRef.current?.focus?.();
                    resetControlsTimer();
                  }}
                  onPressLeft={() => handleScrubberDpad('left')}
                  onPressRight={() => handleScrubberDpad('right')}>
                  {({ focused }) => {
                    const isHighlighted = focused || isScrubberFocused;
                    return (
                      <View
                        ref={trackRef}
                        style={[StyleSheet.absoluteFill, { justifyContent: 'center' }]}
                        hitSlop={{ top: 14, bottom: 14, left: 10, right: 10 }}
                        onLayout={() => {
                          trackRef.current?.measure((_x: number, _y: number, width: number, _height: number, pageX: number) => {
                            if (width > 0) {
                              trackWidthRef.current = width;
                              trackLeftRef.current = pageX;
                              setTrackWidth(width);
                            }
                          });
                        }}
                        onStartShouldSetResponder={() => true}
                        onMoveShouldSetResponder={() => true}
                        onResponderGrant={handleScrubberGrant}
                        onResponderMove={handleScrubberMove}
                        onResponderRelease={handleScrubberRelease}
                        onResponderTerminate={handleScrubberTerminate}>

                        {/* Floating Time Tooltip when Scrubber is focused or scrubbing */}
                        {isHighlighted && (
                          <View
                            style={[
                              styles.scrubberTooltip,
                              { left: progressPercent + '%' },
                            ]}
                            pointerEvents="none">
                            <Text style={styles.scrubberTooltipText}>
                              {formatElapsed(curSec)}
                            </Text>
                          </View>
                        )}

                        <View
                          style={[
                            styles.progressTrack,
                            isTV && styles.progressTrackTV,
                            isHighlighted && styles.progressTrackFocused,
                          ]}
                          pointerEvents="none">
                          {/* Intro & Recap Highlights on Seekbar */}
                          {recapMarkerStyle && (
                            <View style={[styles.recapMarker, recapMarkerStyle]} pointerEvents="none" />
                          )}
                          {introMarkerStyle && (
                            <View style={[styles.introMarker, introMarkerStyle]} pointerEvents="none" />
                          )}
                          <View
                            style={[
                              styles.progressFill,
                              { width: progressPercent + '%' },
                              isHighlighted && styles.progressFillFocused,
                            ]}
                            pointerEvents="none"
                          />
                        </View>
                        <View
                          style={[
                            styles.progressThumb,
                            isTV && styles.progressThumbTV,
                            isHighlighted && styles.progressThumbFocused,
                            { left: progressPercent + '%' },
                          ]}
                          pointerEvents="none"
                        />
                      </View>
                    );
                  }}
                </TVFocusable>

                {/* Countdown only in the last with hh:mm:ss */}
                <Text style={[styles.timeLabel, styles.countdownLabel, isTV && styles.timeLabelTV, isTV && styles.countdownLabelTV]}>
                  {formatCountdown(Math.max(0, durSec - curSec))}
                </Text>
              </View>
            </View>

          </Animated.View>
        )}

        {/* 6. Loading Overlay */}
        {isLoading && !errorMessage && (
          <View style={styles.centerOverlay} pointerEvents="none">
            <ActivityIndicator size="large" color="#FFFFFF" />
          </View>
        )}

        {/* 7. Error Overlay */}
        {errorMessage && (
          <View style={styles.centerOverlay}>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => { setErrorMessage(null); setIsLoading(true); }}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

      </View>

      {/* ── BOTTOM PANEL (Portrait only) ── */}
      {!effectiveFullscreen && (
        <ScrollView style={styles.bottomPanel} showsVerticalScrollIndicator={false}>

          {/* Title Row */}
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.titleText} numberOfLines={1}>{media.title}</Text>
              <Text style={styles.metaText}>
                {media.year}  ·  {source.quality}
                {media.type === 'tv' ? '  ·  TV Series' : ''}
              </Text>
            </View>
            {onToggleWatchlist && (
              <TVFocusable
                style={[styles.glassBtnSmall, isInWatchlist && styles.glassBtnActive]}
                focusedStyle={styles.glassBtnFocused}
                onPress={() => onToggleWatchlist(media)}>
                <BookmarkIcon color={isInWatchlist ? '#4ADE80' : '#FFFFFF'} size={16} />
              </TVFocusable>
            )}
          </View>

          {/* TV Seasons & Episodes Section */}
          {media.type === 'tv' && (
            <View style={styles.episodesSection}>
              <View style={styles.episodesSectionHeader}>
                <Text style={styles.sectionTitle}>Episodes</Text>
                <TouchableOpacity onPress={() => setShowEpisodesModal(true)}>
                  <Text style={styles.seeAllText}>All Seasons ({tvSeasons.length}) ›</Text>
                </TouchableOpacity>
              </View>

              {/* Season selector horizontal tabs */}
              {tvSeasons.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.seasonRail}>
                  {tvSeasons.map(s => {
                    const isSel = s.seasonNumber === selectedSeason;
                    return (
                      <TouchableOpacity
                        key={'panel-season-' + s.seasonNumber}
                        style={[styles.seasonPill, isSel && styles.seasonPillActive]}
                        onPress={() => setSelectedSeason(s.seasonNumber)}>
                        <Text style={[styles.seasonPillText, isSel && styles.seasonPillTextActive]}>
                          {s.name || `Season ${s.seasonNumber}`}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}

              {/* Episodes horizontal cards rail */}
              {loadingEpisodes ? (
                <View style={styles.episodesLoadingRow}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.episodesLoadingText}>Loading episodes...</Text>
                </View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.episodesRail}>
                  {tvEpisodes.map(ep => {
                    const isPlaying = ep.seasonNumber === season && ep.episodeNumber === episode;
                    return (
                      <TouchableOpacity
                        key={'panel-ep-' + ep.seasonNumber + '-' + ep.episodeNumber}
                        style={[styles.epCard, isPlaying && styles.epCardActive]}
                        onPress={() => onSelectEpisode && onSelectEpisode(ep.seasonNumber, ep.episodeNumber, ep)}>
                        <Image
                          source={{ uri: ep.still || media.backdrop || media.poster || 'https://image.tmdb.org/t/p/w300' }}
                          style={styles.epCardStill}
                        />
                        <View style={styles.epCardDetails}>
                          <Text style={styles.epCardNum}>E{ep.episodeNumber} {isPlaying ? '• PLAYING' : ''}</Text>
                          <Text style={styles.epCardTitle} numberOfLines={1}>{ep.name || `Episode ${ep.episodeNumber}`}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </View>
          )}

          {/* Related Items Section */}
          {relatedItems.length > 0 && (
            <View style={styles.relatedSection}>
              <Text style={styles.sectionTitle}>More Like This</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.relatedRail}>
                {relatedItems.slice(0, 15).map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.relatedCard}
                    onPress={() => onSelectRelatedMedia && onSelectRelatedMedia(item)}>
                    <Image
                      source={{ uri: item.poster ? 'https://image.tmdb.org/t/p/w185' + item.poster : '' }}
                      style={styles.relatedPoster}
                    />
                    <Text style={styles.relatedTitle} numberOfLines={2}>{item.title}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Tracks Modal for Audio / Subtitles */}
      <TracksModal
        visible={showTracksModal}
        audioTracks={audioTracks}
        subtitleTracks={subtitleTracks}
        selectedAudioIndex={selectedAudioIndex}
        selectedSubtitleIndex={selectedSubtitleIndex}
        onSelectAudio={(idx) => { setSelectedAudioIndex(idx); setShowTracksModal(false); }}
        onSelectSubtitle={handleSelectSubtitle}
        onClose={() => setShowTracksModal(false)}
      />

      {/* Comprehensive Player Settings Modal */}
      <PlayerSettingsModal
        visible={showSettingsModal}
        isEmbed={isEmbed}
        playbackSpeed={playbackSpeed}
        resizeMode={resizeMode}
        isMuted={isMuted}
        autoSkipIntro={autoSkipIntro}
        onToggleAutoSkipIntro={() => setAutoSkipIntro(prev => !prev)}
        audioTracks={audioTracks}
        subtitleTracks={subtitleTracks}
        qualityOptions={curatedQualities}
        currentSource={source}
        selectedAudioIndex={selectedAudioIndex}
        selectedSubtitleIndex={selectedSubtitleIndex}
        subtitleSize={subtitleSize}
        subtitleOffset={subtitleOffset}
        initialTab={settingsInitialTab}
        onClose={() => setShowSettingsModal(false)}
        onSelectSpeed={(speed) => { setPlaybackSpeed(speed); }}
        onSelectResizeMode={(mode) => setResizeMode(mode)}
        onToggleMute={handleToggleMute}
        onSelectAudio={(idx) => { setSelectedAudioIndex(idx); }}
        onSelectSubtitle={handleSelectSubtitle}
        onSelectSubtitleSize={(sz) => setSubtitleSize(sz)}
        onSelectSubtitleOffset={(off) => setSubtitleOffset(off)}
        onSelectSource={handleSelectQualitySource}
      />

      {/* Seasons & Episodes Modal */}
      <EpisodesModal
        visible={showEpisodesModal}
        media={media}
        currentSeason={season}
        currentEpisode={episode}
        onClose={() => setShowEpisodesModal(false)}
        onSelectEpisode={(sNum, epNum, epData) => {
          if (onSelectEpisode) {
            onSelectEpisode(sNum, epNum, epData);
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },

  // Video viewports
  videoViewportPortrait: {
    backgroundColor: '#000000',
    overflow: 'hidden',
  },
  videoViewportFullscreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
    zIndex: 100,
  },

  // Center overlays
  centerOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 30,
  },

  // Error UI
  errorText: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },

  // Seek flash feedback
  seekFlash: {
    position: 'absolute',
    top: 0, bottom: 0,
    width: '40%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    zIndex: 25,
  },
  seekFlashText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },



  // Top bar HUD (Back on left, Action Icons on right)
  topBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 70,
  },
  topBarTV: {
    paddingHorizontal: 32,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  // Plain borderless icon buttons (No circles)
  plainIconBtn: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plainIconBtnTV: {
    padding: 10,
  },
  plainIconBtnLarge: {
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plainIconBtnLargeTV: {
    padding: 16,
  },
  plainIconBtnFocused: {
    transform: [{ scale: 1.18 }],
    opacity: 1,
  },
  plainIconBtnActive: {
    opacity: 1,
  },

  // Top-left back button
  topLeft: {
    position: 'absolute',
    left: 12,
    zIndex: 50,
  },

  // Liquid glass buttons
  glassBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  glassBtnTV: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  glassBtnSmall: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  glassBtnSmallTV: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  glassBtnLarge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  glassBtnLargeTV: {
    width: 76,
    height: 76,
    borderRadius: 38,
  },
  glassBtnFocused: {
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(255,255,255,0.3)',
    transform: [{ scale: 1.08 }],
  },
  glassBtnActive: {
    backgroundColor: 'rgba(74,222,128,0.2)',
    borderColor: 'rgba(74,222,128,0.5)',
  },
  qualityPillBtn: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qualityPillBtnTV: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 14,
  },
  qualityPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  qualityPillTextTV: {
    fontSize: 14,
    fontWeight: '800',
  },

  // Center playback controls
  centerControls: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 28,
  },

  // Bottom timeline bar
  bottomBar: {
    position: 'absolute',
    left: 0, right: 0,
    flexDirection: 'column',
  },
  bottomBarPortrait: {
    bottom: 0,
    paddingBottom: 0,
    paddingHorizontal: 16,
    paddingTop: 0,
  },
  bottomBarLandscape: {
    bottom: 40,
    paddingBottom: 0,
    paddingHorizontal: 50,
    paddingTop: 0,
  },
  bottomBarTV: {
    bottom: 0,
    paddingHorizontal: 32,
    paddingBottom: 36,
    paddingTop: 12,
  },
  aboveSliderRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 0,
    marginBottom: 0,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  timeLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: '600',
    minWidth: 36,
  },
  timeLabelTV: {
    fontSize: 14,
    minWidth: 48,
  },
  countdownLabel: {
    minWidth: 54,
    textAlign: 'right',
  },
  countdownLabelTV: {
    minWidth: 72,
    textAlign: 'right',
  },
  progressTrackWrap: {
    flex: 1,
    height: 36,
    justifyContent: 'center',
  },
  progressTrack: {
    height: 3.5,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressTrackTV: {
    height: 6,
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  progressThumb: {
    position: 'absolute',
    marginLeft: -6,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    top: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  progressThumbTV: {
    width: 16,
    height: 16,
    borderRadius: 8,
    top: 10,
    marginLeft: -8,
  },
  progressTrackFocused: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  progressFillFocused: {
    backgroundColor: '#E50914',
  },
  progressThumbFocused: {
    width: 24,
    height: 24,
    borderRadius: 12,
    top: 6,
    marginLeft: -12,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#E50914',
    elevation: 8,
    shadowColor: '#E50914',
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  scrubberTooltip: {
    position: 'absolute',
    top: -38,
    marginLeft: -32,
    backgroundColor: 'rgba(20, 20, 20, 0.95)',
    borderWidth: 1.5,
    borderColor: '#E50914',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    minWidth: 64,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 8,
  },
  scrubberTooltipText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
  },

  introMarker: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: '#F59E0B',
    opacity: 0.8,
    borderRadius: 2,
  },
  recapMarker: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: '#38BDF8',
    opacity: 0.8,
    borderRadius: 2,
  },

  // Floating Skip Button (IntroDB)
  skipButtonContainer: {
    position: 'absolute',
    right: 18,
    zIndex: 90,
    elevation: 9,
  },
  skipButtonContainerTV: {
    right: 32,
  },
  skipBtn: {
    backgroundColor: 'rgba(12, 14, 20, 0.9)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  skipBtnTV: {
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 10,
    borderColor: 'rgba(255, 255, 255, 0.75)',
  },
  skipBtnFocused: {
    backgroundColor: '#E50914',
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.06 }],
  },
  skipBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  skipBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  skipBtnTextTV: {
    fontSize: 17,
    fontWeight: '800',
  },
  skipBtnArrow: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 16,
  },

  // Bottom panel
  bottomPanel: {
    flex: 1,
    backgroundColor: '#000000',
  },

  // Title row
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    gap: 10,
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  metaText: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 3,
  },

  // Player mode switcher
  modeRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    padding: 3,
    gap: 3,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
  },
  modeBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  modeBtnText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  modeBtnTextActive: {
    color: '#FFFFFF',
  },

  // Server button
  serverBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    marginBottom: 6,
  },
  serverLabel: {
    color: '#475569',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 2,
  },
  serverName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },

  // Server dropdown
  dropdownList: {
    marginHorizontal: 16,
    backgroundColor: '#111318',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    overflow: 'hidden',
    marginBottom: 8,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  dropdownItemActive: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  dropdownItemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  qualityBadge: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    minWidth: 36,
    alignItems: 'center',
  },
  qualityBadgeText: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: '700',
  },
  dropdownItemName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  dropdownItemSub: {
    color: '#475569',
    fontSize: 10,
    marginTop: 1,
  },
  activeIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },

  // Related
  relatedSection: {
    paddingTop: 16,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  relatedRail: {
    paddingHorizontal: 16,
    gap: 10,
  },
  relatedCard: {
    width: 95,
  },
  relatedPoster: {
    width: 95,
    height: 140,
    borderRadius: 6,
    backgroundColor: '#0A0C12',
  },
  relatedTitle: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 5,
  },

  // Closed Captions (CC) overlay
  subtitleOverlay: {
    position: 'absolute',
    bottom: 46,
    left: 16,
    right: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 42,
  },
  subtitleTextBg: {
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  subtitleText: {
    color: '#FFFF33',
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 22,
  },

  // TV Episodes Section
  episodesSection: {
    paddingTop: 16,
    paddingBottom: 6,
  },
  episodesSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  seeAllText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
  },
  seasonRail: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 10,
  },
  seasonPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  seasonPillActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderColor: '#FFFFFF',
  },
  seasonPillText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  seasonPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  episodesLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  episodesLoadingText: {
    color: '#64748B',
    fontSize: 12,
  },
  episodesRail: {
    paddingHorizontal: 16,
    gap: 10,
  },
  epCard: {
    width: 150,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    overflow: 'hidden',
  },
  epCardActive: {
    borderColor: '#22C55E',
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
  },
  epCardStill: {
    width: '100%',
    height: 84,
    backgroundColor: '#0A0C12',
  },
  epCardDetails: {
    padding: 8,
  },
  epCardNum: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 2,
  },
  epCardTitle: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
});
