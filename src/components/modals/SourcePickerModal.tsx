import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { TVFocusable } from '../common/TVFocusable';
import { PlayIcon, SubtitleIcon } from '../common/Icons';
import { StreamSource } from '../../services/providers';
import { MediaItem } from '../../services/tmdb';

interface SourcePickerModalProps {
  visible: boolean;
  media: MediaItem | null;
  sources: StreamSource[];
  isLoading: boolean;
  onClose: () => void;
  onSelectSource: (source: StreamSource) => void;
}

export function SourcePickerModal({
  visible,
  media,
  sources,
  isLoading,
  onClose,
  onSelectSource,
}: SourcePickerModalProps) {
  if (!visible || !media) return null;

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case '4K':
        return '#F59E0B';
      case '1080p':
        return '#06B6D4';
      case '720p':
        return '#8B5CF6';
      default:
        return '#94A3B8';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={styles.dismissOverlay}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Select Stream</Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {media.title} {media.year ? '(' + media.year + ')' : ''}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#E50914" />
              <Text style={styles.loadingText}>Scraping stream providers...</Text>
            </View>
          ) : sources.length === 0 ? (
            <View style={styles.centerContainer}>
              <Text style={styles.noSourcesText}>No active streams found.</Text>
              <Text style={styles.noSourcesSubtext}>Please try another title or check your network.</Text>
            </View>
          ) : (
            <ScrollView
              style={styles.list}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}>
              {sources.map((source, index) => {
                const color = getQualityColor(source.quality);
                return (
                  <TVFocusable
                    key={source.id}
                    hasTVPreferredFocus={index === 0}
                    style={styles.sourceCard}
                    focusedStyle={styles.sourceCardFocused}
                    onPress={() => onSelectSource(source)}>
                    <View style={styles.sourceLeft}>
                      <View style={[styles.qualityBadge, { borderColor: color }]}>
                        <Text style={[styles.qualityText, { color }]}>
                          {source.quality}
                        </Text>
                      </View>
                      <View style={styles.sourceInfo}>
                        <Text style={styles.sourceName} numberOfLines={1}>
                          {source.name}
                        </Text>
                        <View style={styles.sourceMetaRow}>
                          <Text style={styles.sourceFormat}>
                            {source.format.toUpperCase()}
                          </Text>
                          {source.size ? (
                            <>
                              <Text style={styles.metaDot}>•</Text>
                              <Text style={styles.sourceMetaText}>{source.size}</Text>
                            </>
                          ) : null}
                          {source.subtitles && source.subtitles.length > 0 ? (
                            <>
                              <Text style={styles.metaDot}>•</Text>
                              <View style={styles.subTag}>
                                <SubtitleIcon color="#4ADE80" size={12} />
                                <Text style={styles.subTagText}>
                                  {source.subtitles.length} Subs
                                </Text>
                              </View>
                            </>
                          ) : null}
                        </View>
                      </View>
                    </View>
                    <View style={styles.playAction}>
                      <PlayIcon color="#FFFFFF" size={12} />
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
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dismissOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  sheet: {
    width: '100%',
    maxWidth: 540,
    backgroundColor: '#07080D',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: 'bold',
  },
  centerContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 14,
    fontWeight: '500',
  },
  noSourcesText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  noSourcesSubtext: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },
  list: {
    flexGrow: 0,
  },
  listContent: {
    padding: 16,
    gap: 10,
  },
  sourceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  sourceCardFocused: {
    borderColor: '#E50914',
    backgroundColor: 'rgba(229, 9, 20, 0.12)',
    transform: [{ scale: 1.02 }],
  },
  sourceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  qualityBadge: {
    borderWidth: 1.2,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.3)',
    marginRight: 12,
  },
  qualityText: {
    fontSize: 12,
    fontWeight: '800',
  },
  sourceInfo: {
    flex: 1,
  },
  sourceName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  sourceMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  sourceFormat: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
  },
  metaDot: {
    color: '#475569',
    fontSize: 10,
    marginHorizontal: 6,
  },
  sourceMetaText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  subTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  subTagText: {
    color: '#4ADE80',
    fontSize: 11,
    fontWeight: '600',
  },
  playAction: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E50914',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
