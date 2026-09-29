import React from 'react';
import {
  View,
  Text,
  Modal,
  FlatList,
  Image,
  StyleSheet,
} from 'react-native';
import { MediaItem } from '../../services/tmdb';
import { BookmarkIcon } from '../common/Icons';
import { TVFocusable } from '../common/TVFocusable';
import { useDeviceMode } from '../../hooks/useDeviceMode';

const GRID_GAP = 6;
const GRID_PADDING = 10 * 2;

interface WatchlistModalProps {
  visible: boolean;
  watchlist: MediaItem[];
  onClose: () => void;
  onSelectMedia: (item: MediaItem) => void;
}

export function WatchlistModal({
  visible,
  watchlist,
  onClose,
  onSelectMedia,
}: WatchlistModalProps) {
  const { width: screenWidth, gridColumns } = useDeviceMode();
  const cardWidth = Math.floor(
    (screenWidth - GRID_PADDING - GRID_GAP * (gridColumns - 1)) / gridColumns
  );
  const cardHeight = Math.floor(cardWidth * 1.5);

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
              <Text style={styles.title}>My Watchlist</Text>
              <Text style={styles.count}>{watchlist.length} saved titles</Text>
            </View>
            <TVFocusable
              style={styles.closeBtn}
              focusedStyle={styles.closeBtnFocused}
              hasTVPreferredFocus={true}
              onPress={onClose}>
              <Text style={styles.closeText}>✕</Text>
            </TVFocusable>
          </View>

          {watchlist.length === 0 ? (
            <View style={styles.emptyContainer}>
              <BookmarkIcon color="#3F4557" size={32} />
              <Text style={styles.emptyTitle}>Your Watchlist is empty</Text>
              <Text style={styles.emptySub}>
                Tap "+ Watchlist" on any title to save it for later
              </Text>
            </View>
          ) : (
            <FlatList
              key={`wl-cols-${gridColumns}`}
              data={watchlist}
              keyExtractor={item => `modal-wl-${item.id}`}
              numColumns={gridColumns}
              contentContainerStyle={styles.gridContent}
              columnWrapperStyle={styles.gridRow}
              renderItem={({ item }) => (
                <TVFocusable
                  style={[styles.gridCard, { width: cardWidth, height: cardHeight }]}
                  focusedStyle={styles.cardFocused}
                  onPress={() => {
                    onClose();
                    onSelectMedia(item);
                  }}>
                  {item.poster ? (
                    <Image source={{ uri: item.poster }} style={styles.gridPosterImg} />
                  ) : (
                    <View style={styles.fallbackPoster}>
                      <Text style={styles.fallbackText}>{item.title}</Text>
                    </View>
                  )}
                </TVFocusable>
              )}
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
    borderRadius: 5,
    overflow: 'hidden',
    backgroundColor: '#07080B',
  },
  cardFocused: {
    borderColor: '#FFFFFF',
    borderWidth: 2.5,
    transform: [{ scale: 1.05 }],
    zIndex: 10,
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
});
