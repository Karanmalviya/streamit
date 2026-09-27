import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { TVFocusable } from '../common/TVFocusable';
import { AudioIcon, SubtitleIcon, CheckIcon } from '../common/Icons';

export interface AudioTrackOption {
  index: number;
  title: string;
  language: string;
}

export interface SubtitleTrackOption {
  index: number;
  title: string;
  language: string;
  type?: string;
  uri?: string;
}

interface TracksModalProps {
  visible: boolean;
  audioTracks: AudioTrackOption[];
  subtitleTracks: SubtitleTrackOption[];
  selectedAudioIndex: number;
  selectedSubtitleIndex: number;
  onClose: () => void;
  onSelectAudio: (index: number) => void;
  onSelectSubtitle: (index: number) => void;
}

export function TracksModal({
  visible,
  audioTracks,
  subtitleTracks,
  selectedAudioIndex,
  selectedSubtitleIndex,
  onClose,
  onSelectAudio,
  onSelectSubtitle,
}: TracksModalProps) {
  const [activeTab, setActiveTab] = useState<'audio' | 'subtitles'>('audio');

  if (!visible) return null;

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
            <View style={styles.tabBar}>
              <TVFocusable
                style={[styles.tabBtn, activeTab === 'audio' && styles.tabBtnActive]}
                focusedStyle={styles.tabBtnFocused}
                onPress={() => setActiveTab('audio')}>
                <AudioIcon
                  color={activeTab === 'audio' ? '#FFFFFF' : '#94A3B8'}
                  size={16}
                />
                <Text
                  style={[
                    styles.tabBtnText,
                    activeTab === 'audio' && styles.tabBtnTextActive,
                  ]}>
                  Audio ({audioTracks.length})
                </Text>
              </TVFocusable>

              <TVFocusable
                style={[styles.tabBtn, activeTab === 'subtitles' && styles.tabBtnActive]}
                focusedStyle={styles.tabBtnFocused}
                onPress={() => setActiveTab('subtitles')}>
                <SubtitleIcon
                  color={activeTab === 'subtitles' ? '#FFFFFF' : '#94A3B8'}
                  size={16}
                />
                <Text
                  style={[
                    styles.tabBtnText,
                    activeTab === 'subtitles' && styles.tabBtnTextActive,
                  ]}>
                  Subtitles ({subtitleTracks.length})
                </Text>
              </TVFocusable>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}>
            {activeTab === 'audio' ? (
              audioTracks.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>Default Audio Stream</Text>
                  <Text style={styles.emptySubtext}>No alternate audio languages available for this source.</Text>
                </View>
              ) : (
                audioTracks.map((track, i) => {
                  const isSelected = track.index === selectedAudioIndex;
                  return (
                    <TVFocusable
                      key={'audio-' + track.index + '-' + i}
                      hasTVPreferredFocus={isSelected}
                      style={[styles.trackItem, isSelected && styles.trackItemSelected]}
                      focusedStyle={styles.trackItemFocused}
                      onPress={() => {
                        onSelectAudio(track.index);
                        onClose();
                      }}>
                      <View style={styles.trackInfo}>
                        <Text style={styles.trackTitle}>{track.title || 'Track ' + (track.index + 1)}</Text>
                        <Text style={styles.trackLang}>
                          {track.language ? track.language.toUpperCase() : 'Default'}
                        </Text>
                      </View>
                      {isSelected ? (
                        <View style={styles.checkedCircle}>
                          <CheckIcon color="#FFFFFF" size={12} />
                        </View>
                      ) : null}
                    </TVFocusable>
                  );
                })
              )
            ) : (
              <>
                <TVFocusable
                  hasTVPreferredFocus={selectedSubtitleIndex === -1}
                  style={[
                    styles.trackItem,
                    selectedSubtitleIndex === -1 && styles.trackItemSelected,
                  ]}
                  focusedStyle={styles.trackItemFocused}
                  onPress={() => {
                    onSelectSubtitle(-1);
                    onClose();
                  }}>
                  <View style={styles.trackInfo}>
                    <Text style={styles.trackTitle}>Off</Text>
                    <Text style={styles.trackLang}>Captions Disabled</Text>
                  </View>
                  {selectedSubtitleIndex === -1 ? (
                    <View style={styles.checkedCircle}>
                      <CheckIcon color="#FFFFFF" size={12} />
                    </View>
                  ) : null}
                </TVFocusable>

                {subtitleTracks.map((sub, i) => {
                  const isSelected = sub.index === selectedSubtitleIndex;
                  return (
                    <TVFocusable
                      key={'sub-' + sub.index + '-' + i}
                      style={[styles.trackItem, isSelected && styles.trackItemSelected]}
                      focusedStyle={styles.trackItemFocused}
                      onPress={() => {
                        onSelectSubtitle(sub.index);
                        onClose();
                      }}>
                      <View style={styles.trackInfo}>
                        <Text style={styles.trackTitle}>{sub.title || 'Subtitle ' + (sub.index + 1)}</Text>
                        <Text style={styles.trackLang}>
                          {sub.language ? sub.language.toUpperCase() : 'CC'}
                        </Text>
                      </View>
                      {isSelected ? (
                        <View style={styles.checkedCircle}>
                          <CheckIcon color="#FFFFFF" size={12} />
                        </View>
                      ) : null}
                    </TVFocusable>
                  );
                })}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
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
    maxWidth: 500,
    backgroundColor: '#12141C',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    maxHeight: '75%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  tabBar: {
    flexDirection: 'row',
    gap: 10,
    flex: 1,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabBtnActive: {
    backgroundColor: '#E50914',
  },
  tabBtnFocused: {
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.03 }],
  },
  tabBtnText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  closeBtnText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: 'bold',
  },
  list: {
    flexGrow: 0,
  },
  listContent: {
    padding: 16,
    gap: 8,
  },
  emptyState: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  emptySubtext: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },
  trackItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  trackItemSelected: {
    backgroundColor: 'rgba(229, 9, 20, 0.12)',
    borderColor: 'rgba(229, 9, 20, 0.4)',
  },
  trackItemFocused: {
    borderColor: '#E50914',
    backgroundColor: 'rgba(229, 9, 20, 0.2)',
    transform: [{ scale: 1.02 }],
  },
  trackInfo: {
    flex: 1,
  },
  trackTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  trackLang: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  checkedCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E50914',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
