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
  ChevronDownIcon,
  CCIcon,
  SettingsIcon,
} from '../components/common/Icons';
import { TVFocusable } from '../components/common/TVFocusable';
import { TracksModal, AudioTrackOption, SubtitleTrackOption } from '../components/modals/TracksModal';
import { PlayerSettingsModal } from '../components/modals/PlayerSettingsModal';
import { EpisodesModal } from '../components/modals/EpisodesModal';
import { parseSubtitles, SubtitleCue } from '../utils/subtitleParser';
import { StreamSource } from '../services/providers';
import { useDeviceMode } from '../hooks/useDeviceMode';
import {
  MediaItem,
  fetchSimilarMedia,
  TVSeason,
  TVEpisode,
  fetchTVSeasons,
  fetchTVEpisodes,
} from '../services/tmdb';

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
}: PlayerScreenProps) {
  const isEmbed = source.format === 'embed';
  const videoRef = useRef<VideoRef>(null);
  const webViewRef = useRef<any>(null);

  const { width: screenWidth, isLandscape, isTV } = useDeviceMode();

  // Fullscreen state: Landscape & TV are automatically fullscreen
  const [isFullscreen, setIsFullscreen] = useState(false);
  const effectiveFullscreen = isFullscreen || isLandscape || isTV;
  const [serverDropdownOpen, setServerDropdownOpen] = useState(false);

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

  // Playback state
  const [paused, setPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [trackWidth, setTrackWidth] = useState(0);

  // High precision time & duration refs
  const currentTimeRef = useRef<number>(0);
  const durationRef = useRef<number>(0);

  // Double-tap & single-tap gesture handling
  const lastTapTimeRef = useRef<number>(0);
  const [seekFlash, setSeekFlash] = useState<'left' | 'right' | null>(null);
  const seekFlashTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // HUD Controls visibility
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Audio & Subtitles
  const [showTracksModal, setShowTracksModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [audioTracks, setAudioTracks] = useState<AudioTrackOption[]>([]);
  const [subtitleTracks, setSubtitleTracks] = useState<SubtitleTrackOption[]>([]);
  const [selectedAudioIndex, setSelectedAudioIndex] = useState<number>(0);
  const [selectedSubtitleIndex, setSelectedSubtitleIndex] = useState<number>(-1);
  const [subtitleSize, setSubtitleSize] = useState<number>(16);
  const [subtitleOffset, setSubtitleOffset] = useState<number>(0);
  const [subtitleCues, setSubtitleCues] = useState<SubtitleCue[]>([]);

  // Group sources by type
  const nativeSources = availableSources.filter(s => s.format !== 'embed');
  const embedSources = availableSources.filter(s => s.format === 'embed');

  // Reset auto-hide timer for controls
  const resetControlsTimer = useCallback(() => {
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    setShowControls(true);
    controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 4000);
  }, []);

  useEffect(() => {
    resetControlsTimer();
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [resetControlsTimer]);

  // Hide / show system navigation bar, status bars, and lock orientation in fullscreen mode
  useEffect(() => {
    if (effectiveFullscreen) {
      NativeModules.SystemBarModule?.lockLandscape();
      NativeModules.SystemBarModule?.hideSystemBars();
    } else {
      NativeModules.SystemBarModule?.unlockOrientation();
      NativeModules.SystemBarModule?.showSystemBars();
    }

    return () => {
      NativeModules.SystemBarModule?.unlockOrientation();
      NativeModules.SystemBarModule?.showSystemBars();
    };
  }, [effectiveFullscreen]);

  useEffect(() => {
    let isMounted = true;
    fetchSimilarMedia(media.id, media.type)
      .then(items => { if (isMounted) setRelatedItems(items); })
      .catch(() => {});
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
      .catch(() => {});
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
      if (serverDropdownOpen) { setServerDropdownOpen(false); return true; }
      if (showEpisodesModal) { setShowEpisodesModal(false); return true; }
      if (showSettingsModal) { setShowSettingsModal(false); return true; }
      if (showTracksModal) { setShowTracksModal(false); return true; }
      if (isFullscreen) { setIsFullscreen(false); return true; }
      onClose();
      return true;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [serverDropdownOpen, showEpisodesModal, showSettingsModal, showTracksModal, isFullscreen, onClose]);

  // Flash indicator for 10s seek
  const triggerSeekFlash = (dir: 'left' | 'right') => {
    if (seekFlashTimeout.current) clearTimeout(seekFlashTimeout.current);
    setSeekFlash(dir);
    seekFlashTimeout.current = setTimeout(() => setSeekFlash(null), 700);
  };

  // UNIFIED SEEK FUNCTION (Works for both Native & Embed)
  const handleSeek = useCallback((seconds: number) => {
    const cur = currentTimeRef.current;
    const dur = durationRef.current;
    let target = cur + seconds;
    if (target < 0) target = 0;
    if (dur > 0 && target > dur) target = dur;

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
            if (v) { v.currentTime = ${target}; }
          } catch(e) {}
        })();
        true;
      `;
      webViewRef.current?.injectJavaScript(js);
    } else {
      videoRef.current?.seek(target);
    }

    currentTimeRef.current = target;
    setCurrentTime(target);
    resetControlsTimer();
  }, [isEmbed, resetControlsTimer]);

  // UNIFIED ABSOLUTE SEEK (From progress scrubber)
  const handleSeekTo = useCallback((targetTime: number) => {
    const dur = durationRef.current;
    let t = Math.max(0, targetTime);
    if (dur > 0 && t > dur) t = dur;

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
            if (v) { v.currentTime = ${t}; }
          } catch(e) {}
        })();
        true;
      `;
      webViewRef.current?.injectJavaScript(js);
    } else {
      videoRef.current?.seek(t);
    }

    currentTimeRef.current = t;
    setCurrentTime(t);
    resetControlsTimer();
  }, [isEmbed, resetControlsTimer]);

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
  const handleScreenTouch = (evt: any) => {
    const now = Date.now();
    const x = evt.nativeEvent.locationX;
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
    } else {
      if (showControls) {
        setShowControls(false);
      } else {
        resetControlsTimer();
      }
    }
  };

  // Video Load / Progress handlers (Native)
  const handleLoad = useCallback((data: OnLoadData) => {
    setIsLoading(false);
    setErrorMessage(null);
    const d = data.duration || 0;
    durationRef.current = d;
    setDuration(d);
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
    currentTimeRef.current = data.currentTime;
    setCurrentTime(data.currentTime);
    if (isLoading) setIsLoading(false);
  }, [isLoading]);

  const handleError = useCallback((err: any) => {
    console.warn('Native Video Error:', err);
    setIsLoading(false);
    setErrorMessage('Failed to connect to direct stream. Switch to Embed server.');
  }, []);

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
    } catch {}
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

  const formatTime = (secs: number) => {
    const t = Math.floor(Math.max(0, secs));
    const h = Math.floor(t / 3600);
    const m = Math.floor((t % 3600) / 60);
    const s = t % 60;
    if (h > 0) return h + ':' + (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
    return m + ':' + (s < 10 ? '0' : '') + s;
  };

  const curSec = currentTimeRef.current;
  const durSec = durationRef.current;
  const progressPercent = durSec > 0 ? Math.min((curSec / durSec) * 100, 100) : 0;

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
              source={{ uri: source.url, headers: source.headers }}
              style={StyleSheet.absoluteFill}
              resizeMode={resizeMode}
              rate={playbackSpeed}
              muted={isMuted}
              paused={paused}
              onLoad={handleLoad}
              onProgress={handleProgress}
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

        {/* 2. Transparent Full-Screen Gesture Layer (Only on Native mode so touches reach Embed WebView) */}
        {!isEmbed && (
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

        {/* 5. UNIFIED CONTROLS HUD (Rendered for BOTH Embed & Native) */}
        {showControls && (
          <View style={[StyleSheet.absoluteFill, { zIndex: 60 }]} pointerEvents="box-none">

            {/* Minimal Back Button (Top Left) */}
            <View
              style={[
                styles.floatingBackWrap,
                {
                  top: isTV ? 20 : (effectiveFullscreen ? Math.max(safeTop, 16) : 12),
                  left: isTV ? 28 : 12,
                },
              ]}
              pointerEvents="box-none">
              <TVFocusable
                style={[styles.glassBtn, isTV && styles.glassBtnTV]}
                focusedStyle={styles.glassBtnFocused}
                activeOpacity={0.7}
                onPress={() => { if (isFullscreen) setIsFullscreen(false); else onClose(); }}>
                <BackIcon color="#FFFFFF" size={isTV ? 20 : 16} />
              </TVFocusable>
            </View>

            {/* Center Playback Controls (Liquid Glass Style) */}
            <View style={[styles.centerControls, isTV && { gap: 40 }]} pointerEvents="box-none">
              {/* Rewind 10s */}
              <TVFocusable
                style={[styles.glassBtn, isTV && styles.glassBtnTV]}
                focusedStyle={styles.glassBtnFocused}
                activeOpacity={0.7}
                onPress={() => {
                  handleSeek(-10);
                  triggerSeekFlash('left');
                }}>
                <Replay10Icon color="#FFFFFF" size={isTV ? 28 : 22} />
              </TVFocusable>

              {/* Play / Pause */}
              <TVFocusable
                style={[styles.glassBtnLarge, isTV && styles.glassBtnLargeTV]}
                focusedStyle={styles.glassBtnFocused}
                activeOpacity={0.7}
                hasTVPreferredFocus={true}
                onPress={handleTogglePlay}>
                {paused ? <PlayIcon color="#FFFFFF" size={isTV ? 28 : 22} /> : <PauseIcon color="#FFFFFF" size={isTV ? 26 : 20} />}
              </TVFocusable>

              {/* Forward 10s */}
              <TVFocusable
                style={[styles.glassBtn, isTV && styles.glassBtnTV]}
                focusedStyle={styles.glassBtnFocused}
                activeOpacity={0.7}
                onPress={() => {
                  handleSeek(10);
                  triggerSeekFlash('right');
                }}>
                <Forward10Icon color="#FFFFFF" size={isTV ? 28 : 22} />
              </TVFocusable>
            </View>

            {/* Bottom Timeline Bar */}
            <View style={[styles.bottomBar, isTV && styles.bottomBarTV]}>
              <Text style={[styles.timeLabel, isTV && styles.timeLabelTV]}>{formatTime(currentTime)}</Text>

              {/* Interactive Scrubber Track */}
              <TouchableOpacity
                activeOpacity={1}
                style={styles.progressTrackWrap}
                onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
                onPress={(e) => {
                  if (durationRef.current > 0 && trackWidth > 0) {
                    const ratio = Math.max(0, Math.min(1, e.nativeEvent.locationX / trackWidth));
                    const target = ratio * durationRef.current;
                    handleSeekTo(target);
                  }
                }}>
                <View style={[styles.progressTrack, isTV && styles.progressTrackTV]} pointerEvents="none">
                  <View style={[styles.progressFill, { width: progressPercent + '%' }]} pointerEvents="none" />
                </View>
                <View style={[styles.progressThumb, isTV && styles.progressThumbTV, { left: progressPercent + '%' }]} pointerEvents="none" />
              </TouchableOpacity>

              <Text style={[styles.timeLabel, isTV && styles.timeLabelTV]}>{formatTime(duration)}</Text>

              {/* CC Quick Toggle */}
              <TVFocusable
                style={[styles.glassBtnSmall, isTV && styles.glassBtnSmallTV, selectedSubtitleIndex >= 0 && styles.glassBtnActive]}
                focusedStyle={styles.glassBtnFocused}
                activeOpacity={0.7}
                onPress={handleToggleCC}>
                <CCIcon color={selectedSubtitleIndex >= 0 ? '#4ADE80' : '#FFFFFF'} size={isTV ? 19 : 15} />
              </TVFocusable>

              {/* Player Settings (CC, Speed, Aspect Ratio, Audio) */}
              <TVFocusable
                style={[styles.glassBtnSmall, isTV && styles.glassBtnSmallTV]}
                focusedStyle={styles.glassBtnFocused}
                activeOpacity={0.7}
                onPress={() => setShowSettingsModal(true)}>
                <SettingsIcon color="#FFFFFF" size={isTV ? 19 : 15} />
              </TVFocusable>

              {/* Fullscreen Toggle (shown when not on TV) */}
              {!isTV && (
                <TVFocusable
                  style={styles.glassBtnSmall}
                  focusedStyle={styles.glassBtnFocused}
                  activeOpacity={0.7}
                  onPress={() => setIsFullscreen(f => !f)}>
                  {isFullscreen
                    ? <ExitFullscreenIcon color="#FFFFFF" size={15} />
                    : <FullscreenIcon color="#FFFFFF" size={15} />}
                </TVFocusable>
              )}
            </View>

          </View>
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

          {/* Player Mode Switcher: Native | Embed */}
          <View style={styles.modeRow}>
            {nativeSources.length > 0 && (
              <TouchableOpacity
                style={[styles.modeBtn, !isEmbed && styles.modeBtnActive]}
                onPress={() => onSelectSource && onSelectSource(nativeSources[0])}>
                <Text style={[styles.modeBtnText, !isEmbed && styles.modeBtnTextActive]}>Native</Text>
              </TouchableOpacity>
            )}
            {embedSources.length > 0 && (
              <TouchableOpacity
                style={[styles.modeBtn, isEmbed && styles.modeBtnActive]}
                onPress={() => onSelectSource && onSelectSource(embedSources[0])}>
                <Text style={[styles.modeBtnText, isEmbed && styles.modeBtnTextActive]}>Embed</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Server Selector Button */}
          <TouchableOpacity
            style={styles.serverBtn}
            onPress={() => setServerDropdownOpen(!serverDropdownOpen)}>
            <View style={{ flex: 1 }}>
              <Text style={styles.serverLabel}>SERVER</Text>
              <Text style={styles.serverName} numberOfLines={1}>{source.name}</Text>
            </View>
            <ChevronDownIcon color="#64748B" size={14} />
          </TouchableOpacity>

          {/* Server Dropdown List (Shows only sources matching current mode) */}
          {serverDropdownOpen && (
            <View style={styles.dropdownList}>
              {(isEmbed ? embedSources : nativeSources).map((s) => {
                const isActive = s.id === source.id;
                return (
                  <TouchableOpacity
                    key={s.id}
                    style={[styles.dropdownItem, isActive && styles.dropdownItemActive]}
                    onPress={() => {
                      onSelectSource && onSelectSource(s);
                      setServerDropdownOpen(false);
                    }}>
                    <View style={styles.dropdownItemLeft}>
                      <View style={styles.qualityBadge}>
                        <Text style={styles.qualityBadgeText}>{s.quality}</Text>
                      </View>
                      <View>
                        <Text style={styles.dropdownItemName} numberOfLines={1}>{s.name}</Text>
                        <Text style={styles.dropdownItemSub}>{s.format === 'embed' ? 'Embed Server' : 'Direct Native Stream'}</Text>
                      </View>
                    </View>
                    {isActive && <View style={styles.activeIndicator} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

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
        audioTracks={audioTracks}
        subtitleTracks={subtitleTracks}
        selectedAudioIndex={selectedAudioIndex}
        selectedSubtitleIndex={selectedSubtitleIndex}
        subtitleSize={subtitleSize}
        subtitleOffset={subtitleOffset}
        onClose={() => setShowSettingsModal(false)}
        onSelectSpeed={(speed) => { setPlaybackSpeed(speed); }}
        onSelectResizeMode={(mode) => setResizeMode(mode)}
        onToggleMute={handleToggleMute}
        onSelectAudio={(idx) => { setSelectedAudioIndex(idx); }}
        onSelectSubtitle={handleSelectSubtitle}
        onSelectSubtitleSize={(sz) => setSubtitleSize(sz)}
        onSelectSubtitleOffset={(off) => setSubtitleOffset(off)}
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

  // Floating back button layout
  floatingBackWrap: {
    position: 'absolute',
    zIndex: 100,
    elevation: 10,
  },
  topBar: {
    position: 'absolute',
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 100,
    elevation: 10,
  },
  topRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  glassPillBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  glassPillBtnTV: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
  },
  glassPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  glassPillTextTV: {
    fontSize: 13,
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
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.32)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  glassBtnLargeTV: {
    width: 72,
    height: 72,
    borderRadius: 36,
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
    bottom: 0, left: 0, right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 8,
    paddingTop: 6,
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  bottomBarTV: {
    paddingHorizontal: 28,
    paddingBottom: 20,
    paddingTop: 10,
    gap: 12,
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
  progressTrackWrap: {
    flex: 1,
    height: 24,
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
    top: 6,
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
    top: 4,
    marginLeft: -8,
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
