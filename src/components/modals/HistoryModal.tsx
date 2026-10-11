import React from 'react';
import {
  View,
  Text,
  Modal,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { MediaItem } from '../../services/tmdb';
import { WatchHistoryItem, clearWatchHistory, removeFromWatchHistory } from '../../services/history';
import { PlayIcon } from '../common/Icons';
import { TVFocusable } from '../common/TVFocusable';
import { useDeviceMode } from '../../hooks/useDeviceMode';

const GRID_GAP = 6;
const GRID_PADDING = 10 * 2;

interface HistoryModalProps {
  visible: boolean;
  history: WatchHistoryItem[];
  onClose: () => void;
  onSelectMedia: (item: MediaItem) => void;
  onClearHistory: () => void;
}

export function HistoryModal({
  visible,
  history,
  onClose,
  onSelectMedia,
  onClearHistory,
}: HistoryModalProps) {
  const { width: screenWidth, gridColumns } = useDeviceMode();
  const cardWidth = Math.floor(
    (screenWidth - GRID_PADDING - GRID_GAP * (gridColumns - 1)) / gridColumns
  );
  // Using 16:9 for landscape history cards
  const cardHeight = Math.floor(cardWidth * 0.5625);

  const handleClearAll = async () => {
    await clearWatchHistory();
    onClearHistory();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.sheetBackdrop}>
        <View style={styles.sheetContainer}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Watch History</Text>
              <Text style={styles.count}>{history.length} titles</Text>
            </View>
            <View style={styles.headerActions}>
              {history.length > 0 && (
                <TVFocusable
                  style={styles.clearBtn}
                  focusedStyle={styles.clearBtnFocused}
                  onPress={handleClearAll}>
                  <Text style={styles.clearText}>Clear All</Text>
                </TVFocusable>
              )}
              <TVFocusable
                style={styles.closeBtn}
                focusedStyle={styles.closeBtnFocused}
                hasTVPreferredFocus={true}
                onPress={onClose}>
                <Text style={styles.closeText}>✕</Text>
              </TVFocusable>
            </View>
          </View>

          {history.length === 0 ? (
            <View style={styles.emptyContainer}>
              <PlayIcon color="#3F4557" size={32} />
              <Text style={styles.emptyTitle}>Your History is empty</Text>
              <Text style={styles.emptySub}>
                Titles you watch will appear here
              </Text>
            </View>
          ) : (
            <FlatList
              key={`hist-cols-${gridColumns}`}
              data={history}
              keyExtractor={item => `modal-hist-${item.media.id}`}
              numColumns={gridColumns}
              contentContainerStyle={styles.gridContent}
              columnWrapperStyle={styles.gridRow}
              initialNumToRender={15}
              maxToRenderPerBatch={12}
              windowSize={5}
              removeClippedSubviews={false}
              renderItem={({ item }) => {
                const progressPercent = item.duration > 0 ? (item.progress / item.duration) * 100 : 0;
                const timeLeftMins = item.duration > 0 ? Math.max(1, Math.ceil((item.duration - item.progress) / 60)) : 0;
                let timeFormatted = `${timeLeftMins}m left`;
                if (timeLeftMins >= 60) {
                  const h = Math.floor(timeLeftMins / 60);
                  const m = timeLeftMins % 60;
                  timeFormatted = m > 0 ? `${h}h ${m}m left` : `${h}h left`;
                }
                
                const isTV = item.media.type === 'tv' && item.season && item.episode;
                const subtitleText = isTV ? `S${item.season} E${item.episode} • ${timeFormatted}` : timeFormatted;

                return (
                  <TVFocusable
                    style={styles.gridCard}
                    focusedStyle={styles.cardFocused}
                    onPress={() => {
                      onClose();
                      onSelectMedia(item.media);
                    }}>
                    <View style={[styles.gridImageWrap, { width: cardWidth, height: cardHeight }]}>
                      {item.media.backdrop || item.media.poster ? (
                        <Image 
                          source={{ uri: item.media.backdrop || item.media.poster || undefined }} 
                          style={styles.gridPosterImg} 
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.fallbackPoster}>
                          <Text style={styles.fallbackText}>{item.media.title}</Text>
                        </View>
                      )}
                      <View style={styles.progressBarContainer}>
                        <View style={[styles.progressBar, { width: `${Math.min(100, progressPercent)}%` }]} />
                      </View>
                    </View>
                    <View style={styles.cardTextWrap}>
                      <Text style={styles.cardTitleBelow} numberOfLines={1}>{item.media.title}</Text>
                      <Text style={styles.cardSubtitleBelow} numberOfLines={1}>{subtitleText}</Text>
                    </View>
                  </TVFocusable>
                );
              }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#040406',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#0F1118',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  count: {
    fontSize: 11,
    color: '#70778C',
    fontWeight: '600',
    marginTop: 2,
  },
  clearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  clearBtnFocused: {
    backgroundColor: '#3F4557',
  },
  clearText: {
    color: '#A0A7B8',
    fontSize: 12,
    fontWeight: '700',
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnFocused: {
    borderColor: '#FFFFFF',
    borderWidth: 2,
    backgroundColor: '#1E2333',
  },
  closeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
    paddingHorizontal: 30,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySub: {
    color: '#555C70',
    fontSize: 12,
    textAlign: 'center',
  },
  gridContent: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 40,
  },
  gridRow: {
    gap: GRID_GAP,
    marginBottom: GRID_GAP,
  },
  gridCard: {
    marginBottom: 24,
  },
  cardFocused: {
    zIndex: 10,
  },
  gridImageWrap: {
    backgroundColor: '#07080B',
    borderRadius: 5,
    overflow: 'hidden',
  },
  gridPosterImg: {
    width: '100%',
    height: '100%',
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
  cardTextWrap: {
    marginTop: 6,
    paddingHorizontal: 2,
  },
  cardTitleBelow: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  cardSubtitleBelow: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '500',
  },
  progressBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#E50914',
  }
});
