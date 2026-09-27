import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { TVFocusable } from '../common/TVFocusable';
import { PlayIcon, CheckIcon } from '../common/Icons';
import {
  MediaItem,
  TVSeason,
  TVEpisode,
  fetchTVSeasons,
  fetchTVEpisodes,
} from '../../services/tmdb';

interface EpisodesModalProps {
  visible: boolean;
  media: MediaItem | null;
  currentSeason?: number;
  currentEpisode?: number;
  onClose: () => void;
  onSelectEpisode: (season: number, episode: number, episodeData?: TVEpisode) => void;
}

export function EpisodesModal({
  visible,
  media,
  currentSeason = 1,
  currentEpisode = 1,
  onClose,
  onSelectEpisode,
}: EpisodesModalProps) {
  const [seasons, setSeasons] = useState<TVSeason[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<number>(currentSeason);
  const [episodes, setEpisodes] = useState<TVEpisode[]>([]);
  const [loadingSeasons, setLoadingSeasons] = useState<boolean>(true);
  const [loadingEpisodes, setLoadingEpisodes] = useState<boolean>(true);

  // Sync selected season with prop when modal opens
  useEffect(() => {
    if (visible && currentSeason) {
      setSelectedSeason(currentSeason);
    }
  }, [visible, currentSeason]);

  // 1. Fetch seasons when media changes or modal opens
  useEffect(() => {
    if (!visible || !media || media.type !== 'tv') return;

    let isMounted = true;
    setLoadingSeasons(true);

    fetchTVSeasons(media.id)
      .then(res => {
        if (isMounted) {
          setSeasons(res);
          // If current selected season is not in list, select first
          if (res.length > 0 && !res.some(s => s.seasonNumber === selectedSeason)) {
            setSelectedSeason(res[0].seasonNumber);
          }
          setLoadingSeasons(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoadingSeasons(false);
      });

    return () => {
      isMounted = false;
    };
  }, [visible, media, selectedSeason]);

  // 2. Fetch episodes whenever selectedSeason changes
  useEffect(() => {
    if (!visible || !media || !selectedSeason) return;

    let isMounted = true;
    setLoadingEpisodes(true);

    fetchTVEpisodes(media.id, selectedSeason)
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
  }, [visible, media, selectedSeason]);

  if (!visible || !media) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={styles.dismissOverlay}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleInfo}>
              <Text style={styles.headerTitle}>Seasons & Episodes</Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {media.title}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Season Tabs Selector */}
          {loadingSeasons ? (
            <View style={styles.seasonLoadingRow}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.loadingText}>Loading seasons...</Text>
            </View>
          ) : seasons.length > 0 ? (
            <View style={styles.seasonSelectorWrap}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.seasonScrollContent}>
                {seasons.map(s => {
                  const isSelected = s.seasonNumber === selectedSeason;
                  return (
                    <TVFocusable
                      key={'season-' + s.seasonNumber}
                      hasTVPreferredFocus={isSelected}
                      style={[styles.seasonTab, isSelected && styles.seasonTabActive]}
                      focusedStyle={styles.seasonTabFocused}
                      onPress={() => setSelectedSeason(s.seasonNumber)}>
                      <Text
                        style={[
                          styles.seasonTabText,
                          isSelected && styles.seasonTabTextActive,
                        ]}>
                        {s.name || `Season ${s.seasonNumber}`}
                      </Text>
                      <Text style={styles.seasonEpCount}>
                        {s.episodeCount} eps
                      </Text>
                    </TVFocusable>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}

          {/* Episodes List */}
          {loadingEpisodes ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.loadingText}>Loading episodes...</Text>
            </View>
          ) : episodes.length === 0 ? (
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>No episodes found for this season.</Text>
            </View>
          ) : (
            <ScrollView
              style={styles.list}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}>
              {episodes.map(ep => {
                const isPlaying =
                  ep.seasonNumber === currentSeason &&
                  ep.episodeNumber === currentEpisode;

                return (
                  <TVFocusable
                    key={'ep-' + ep.seasonNumber + '-' + ep.episodeNumber}
                    hasTVPreferredFocus={isPlaying}
                    style={[styles.episodeCard, isPlaying && styles.episodeCardActive]}
                    focusedStyle={styles.episodeCardFocused}
                    onPress={() => {
                      onSelectEpisode(ep.seasonNumber, ep.episodeNumber, ep);
                      onClose();
                    }}>
                    {/* Thumbnail Still */}
                    <View style={styles.thumbWrap}>
                      <Image
                        source={{
                          uri:
                            ep.still ||
                            media.backdrop ||
                            media.poster ||
                            'https://image.tmdb.org/t/p/w300',
                        }}
                        style={styles.thumbImage}
                        resizeMode="cover"
                      />
                      <View style={styles.thumbOverlay}>
                        <View style={styles.playIconCircle}>
                          <PlayIcon color="#FFFFFF" size={10} />
                        </View>
                      </View>
                      {ep.runtime > 0 && (
                        <View style={styles.runtimeBadge}>
                          <Text style={styles.runtimeText}>{ep.runtime}m</Text>
                        </View>
                      )}
                    </View>

                    {/* Details */}
                    <View style={styles.episodeDetails}>
                      <View style={styles.episodeTitleRow}>
                        <Text style={styles.episodeNumber}>
                          E{ep.episodeNumber}
                        </Text>
                        <Text style={styles.episodeTitle} numberOfLines={1}>
                          {ep.name || `Episode ${ep.episodeNumber}`}
                        </Text>
                        {isPlaying && (
                          <View style={styles.playingBadge}>
                            <CheckIcon color="#22C55E" size={10} />
                            <Text style={styles.playingBadgeText}>PLAYING</Text>
                          </View>
                        )}
                      </View>

                      <Text style={styles.episodeOverview} numberOfLines={2}>
                        {ep.overview}
                      </Text>

                      {ep.airDate ? (
                        <Text style={styles.episodeAirDate}>
                          Aired: {ep.airDate}
                        </Text>
                      ) : null}
                    </View>
                  </TVFocusable>
                );
              })}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  dismissOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheet: {
    backgroundColor: '#0F1117',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    maxHeight: '88%',
    height: '88%',
    width: '100%',
    maxWidth: 680,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  titleInfo: {
    flex: 1,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },

  // Season Tabs
  seasonSelectorWrap: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  seasonScrollContent: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  seasonTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 6,
  },
  seasonTabActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderColor: '#FFFFFF',
  },
  seasonTabFocused: {
    borderColor: '#FFFFFF',
    borderWidth: 1.5,
  },
  seasonTabText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  seasonTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  seasonEpCount: {
    color: '#64748B',
    fontSize: 11,
  },
  seasonLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },

  // Episodes List
  list: {
    flex: 1,
    paddingHorizontal: 14,
  },
  listContent: {
    paddingVertical: 12,
    gap: 10,
  },
  episodeCard: {
    flexDirection: 'row',
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
    padding: 8,
    gap: 12,
  },
  episodeCardActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
    borderColor: 'rgba(34, 197, 94, 0.35)',
  },
  episodeCardFocused: {
    borderColor: '#FFFFFF',
    borderWidth: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  thumbWrap: {
    width: 110,
    height: 65,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#1E293B',
    position: 'relative',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  runtimeBadge: {
    position: 'absolute',
    bottom: 3,
    right: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  runtimeText: {
    color: '#CBD5E1',
    fontSize: 9,
    fontWeight: '700',
  },
  episodeDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  episodeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  episodeNumber: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '800',
  },
  episodeTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  playingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
  },
  playingBadgeText: {
    color: '#22C55E',
    fontSize: 9,
    fontWeight: '800',
  },
  episodeOverview: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 15,
  },
  episodeAirDate: {
    color: '#475569',
    fontSize: 10,
    marginTop: 3,
  },

  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 8,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 13,
  },
});
