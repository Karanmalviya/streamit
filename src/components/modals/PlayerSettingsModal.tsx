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
import {
  AudioIcon,
  CheckIcon,
  SettingsIcon,
  CCIcon,
  VolumeIcon,
  VolumeMuteIcon,
} from '../common/Icons';
import { AudioTrackOption, SubtitleTrackOption } from './TracksModal';
import { ResizeMode } from 'react-native-video';

export interface PlayerSettingsModalProps {
  visible: boolean;
  isEmbed: boolean;
  playbackSpeed: number;
  resizeMode: ResizeMode;
  isMuted: boolean;
  autoSkipIntro?: boolean;
  audioTracks: AudioTrackOption[];
  subtitleTracks: SubtitleTrackOption[];
  selectedAudioIndex: number;
  selectedSubtitleIndex: number;
  subtitleSize: number;
  subtitleOffset: number;
  onClose: () => void;
  onSelectSpeed: (speed: number) => void;
  onSelectResizeMode: (mode: ResizeMode) => void;
  onToggleMute: () => void;
  onToggleAutoSkipIntro?: () => void;
  onSelectAudio: (index: number) => void;
  onSelectSubtitle: (index: number) => void;
  onSelectSubtitleSize: (size: number) => void;
  onSelectSubtitleOffset: (offset: number) => void;
}

type SettingsTab = 'subtitles' | 'playback' | 'audio' | 'display';

export function PlayerSettingsModal({
  visible,
  isEmbed,
  playbackSpeed,
  resizeMode,
  isMuted,
  autoSkipIntro = false,
  audioTracks,
  subtitleTracks,
  selectedAudioIndex,
  selectedSubtitleIndex,
  subtitleSize,
  subtitleOffset,
  onClose,
  onSelectSpeed,
  onSelectResizeMode,
  onToggleMute,
  onToggleAutoSkipIntro,
  onSelectAudio,
  onSelectSubtitle,
  onSelectSubtitleSize,
  onSelectSubtitleOffset,
}: PlayerSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('subtitles');

  if (!visible) return null;

  const speedList = [0.75, 1.0, 1.25, 1.5, 2.0];
  const sizeList = [
    { label: 'Small', value: 13 },
    { label: 'Medium', value: 16 },
    { label: 'Large', value: 20 },
    { label: 'Extra Large', value: 24 },
  ];
  const offsetList = [
    { label: '-2.0s', value: -2.0 },
    { label: '-1.0s', value: -1.0 },
    { label: '-0.5s', value: -0.5 },
    { label: '0.0s (Sync)', value: 0 },
    { label: '+0.5s', value: 0.5 },
    { label: '+1.0s', value: 1.0 },
    { label: '+2.0s', value: 2.0 },
  ];

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
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <SettingsIcon color="#FFFFFF" size={18} />
              <Text style={styles.headerTitle}>Player Settings</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Navigation Tabs */}
          <View style={styles.tabBar}>
            <TVFocusable
              style={[styles.tabBtn, activeTab === 'subtitles' && styles.tabBtnActive]}
              focusedStyle={styles.tabBtnFocused}
              onPress={() => setActiveTab('subtitles')}>
              <CCIcon color={activeTab === 'subtitles' ? '#FFFFFF' : '#94A3B8'} size={14} />
              <Text style={[styles.tabBtnText, activeTab === 'subtitles' && styles.tabBtnTextActive]}>
                CC / Subs
              </Text>
            </TVFocusable>

            <TVFocusable
              style={[styles.tabBtn, activeTab === 'playback' && styles.tabBtnActive]}
              focusedStyle={styles.tabBtnFocused}
              onPress={() => setActiveTab('playback')}>
              <Text style={[styles.tabBtnText, activeTab === 'playback' && styles.tabBtnTextActive]}>
                Playback
              </Text>
            </TVFocusable>

            <TVFocusable
              style={[styles.tabBtn, activeTab === 'display' && styles.tabBtnActive]}
              focusedStyle={styles.tabBtnFocused}
              onPress={() => setActiveTab('display')}>
              <Text style={[styles.tabBtnText, activeTab === 'display' && styles.tabBtnTextActive]}>
                Aspect Ratio
              </Text>
            </TVFocusable>

            <TVFocusable
              style={[styles.tabBtn, activeTab === 'audio' && styles.tabBtnActive]}
              focusedStyle={styles.tabBtnFocused}
              onPress={() => setActiveTab('audio')}>
              <AudioIcon color={activeTab === 'audio' ? '#FFFFFF' : '#94A3B8'} size={14} />
              <Text style={[styles.tabBtnText, activeTab === 'audio' && styles.tabBtnTextActive]}>
                Audio
              </Text>
            </TVFocusable>
          </View>

          {/* Content Area */}
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}>

            {/* TAB: SUBTITLES & CLOSED CAPTIONS */}
            {activeTab === 'subtitles' && (
              <View style={styles.sectionWrap}>
                <Text style={styles.sectionHeader}>CLOSED CAPTIONS TRACK</Text>

                {/* Subtitle Track Items */}
                <TVFocusable
                  hasTVPreferredFocus={selectedSubtitleIndex === -1}
                  style={[styles.itemRow, selectedSubtitleIndex === -1 && styles.itemRowSelected]}
                  focusedStyle={styles.itemRowFocused}
                  onPress={() => onSelectSubtitle(-1)}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle}>Off (Disable Subtitles)</Text>
                    <Text style={styles.itemSub}>No closed captions</Text>
                  </View>
                  {selectedSubtitleIndex === -1 && (
                    <View style={styles.checkedCircle}>
                      <CheckIcon color="#FFFFFF" size={12} />
                    </View>
                  )}
                </TVFocusable>

                {subtitleTracks.map((track, i) => {
                  const isSelected = track.index === selectedSubtitleIndex;
                  return (
                    <TVFocusable
                      key={'sub-' + track.index + '-' + i}
                      style={[styles.itemRow, isSelected && styles.itemRowSelected]}
                      focusedStyle={styles.itemRowFocused}
                      onPress={() => onSelectSubtitle(track.index)}>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemTitle}>{track.title}</Text>
                        <Text style={styles.itemSub}>
                          {track.language ? track.language.toUpperCase() : 'CC Subtitle'} · HDHub / OpenSubtitles
                        </Text>
                      </View>
                      {isSelected && (
                        <View style={styles.checkedCircle}>
                          <CheckIcon color="#FFFFFF" size={12} />
                        </View>
                      )}
                    </TVFocusable>
                  );
                })}

                {/* CC Customization options (only when subtitles enabled) */}
                {selectedSubtitleIndex >= 0 && (
                  <>
                    <Text style={[styles.sectionHeader, { marginTop: 16 }]}>SUBTITLE FONT SIZE</Text>
                    <View style={styles.gridRow}>
                      {sizeList.map(s => {
                        const isChosen = subtitleSize === s.value;
                        return (
                          <TVFocusable
                            key={'size-' + s.value}
                            style={[styles.gridPill, isChosen && styles.gridPillActive]}
                            focusedStyle={styles.itemRowFocused}
                            onPress={() => onSelectSubtitleSize(s.value)}>
                            <Text style={[styles.gridPillText, isChosen && styles.gridPillTextActive]}>
                              {s.label}
                            </Text>
                          </TVFocusable>
                        );
                      })}
                    </View>

                    <Text style={[styles.sectionHeader, { marginTop: 16 }]}>SUBTITLE SYNC OFFSET</Text>
                    <View style={styles.gridRow}>
                      {offsetList.map(o => {
                        const isChosen = subtitleOffset === o.value;
                        return (
                          <TVFocusable
                            key={'offset-' + o.value}
                            style={[styles.gridPill, isChosen && styles.gridPillActive]}
                            focusedStyle={styles.itemRowFocused}
                            onPress={() => onSelectSubtitleOffset(o.value)}>
                            <Text style={[styles.gridPillText, isChosen && styles.gridPillTextActive]}>
                              {o.label}
                            </Text>
                          </TVFocusable>
                        );
                      })}
                    </View>
                  </>
                )}
              </View>
            )}

            {/* TAB: PLAYBACK SPEED & INTRO AUTO-SKIP */}
            {activeTab === 'playback' && (
              <View style={styles.sectionWrap}>
                {onToggleAutoSkipIntro && (
                  <>
                    <Text style={styles.sectionHeader}>SMART SEGMENTS</Text>
                    <TVFocusable
                      style={[styles.itemRow, autoSkipIntro && styles.itemRowSelected]}
                      focusedStyle={styles.itemRowFocused}
                      onPress={onToggleAutoSkipIntro}>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemTitle}>Auto-Skip Intro & Recap</Text>
                        <Text style={styles.itemSub}>
                          {autoSkipIntro ? 'Enabled: Automatically skips intro & recap segments' : 'Disabled: Displays Skip button when intro is detected'}
                        </Text>
                      </View>
                      <View style={[styles.checkedCircle, autoSkipIntro && { backgroundColor: '#E50914' }]}>
                        {autoSkipIntro && <CheckIcon color="#FFFFFF" size={12} />}
                      </View>
                    </TVFocusable>
                  </>
                )}

                <Text style={[styles.sectionHeader, { marginTop: onToggleAutoSkipIntro ? 16 : 4 }]}>PLAYBACK RATE</Text>
                {speedList.map(speed => {
                  const isSelected = playbackSpeed === speed;
                  return (
                    <TVFocusable
                      key={'speed-' + speed}
                      style={[styles.itemRow, isSelected && styles.itemRowSelected]}
                      focusedStyle={styles.itemRowFocused}
                      onPress={() => onSelectSpeed(speed)}>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemTitle}>{speed}x Speed</Text>
                        <Text style={styles.itemSub}>{speed === 1.0 ? 'Normal Speed' : speed < 1.0 ? 'Slow Motion' : 'Fast Playback'}</Text>
                      </View>
                      {isSelected && (
                        <View style={styles.checkedCircle}>
                          <CheckIcon color="#FFFFFF" size={12} />
                        </View>
                      )}
                    </TVFocusable>
                  );
                })}
              </View>
            )}

            {/* TAB: DISPLAY & ASPECT RATIO */}
            {activeTab === 'display' && (
              <View style={styles.sectionWrap}>
                <Text style={styles.sectionHeader}>ASPECT RATIO / RESIZE MODE</Text>

                <TVFocusable
                  style={[styles.itemRow, resizeMode === ResizeMode.CONTAIN && styles.itemRowSelected]}
                  focusedStyle={styles.itemRowFocused}
                  onPress={() => onSelectResizeMode(ResizeMode.CONTAIN)}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle}>Fit (Contain)</Text>
                    <Text style={styles.itemSub}>Preserve original aspect ratio with black bars if necessary</Text>
                  </View>
                  {resizeMode === ResizeMode.CONTAIN && (
                    <View style={styles.checkedCircle}>
                      <CheckIcon color="#FFFFFF" size={12} />
                    </View>
                  )}
                </TVFocusable>

                <TVFocusable
                  style={[styles.itemRow, resizeMode === ResizeMode.COVER && styles.itemRowSelected]}
                  focusedStyle={styles.itemRowFocused}
                  onPress={() => onSelectResizeMode(ResizeMode.COVER)}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle}>Zoom (Cover)</Text>
                    <Text style={styles.itemSub}>Fill entire screen by cropping edges</Text>
                  </View>
                  {resizeMode === ResizeMode.COVER && (
                    <View style={styles.checkedCircle}>
                      <CheckIcon color="#FFFFFF" size={12} />
                    </View>
                  )}
                </TVFocusable>

                <TVFocusable
                  style={[styles.itemRow, resizeMode === ResizeMode.STRETCH && styles.itemRowSelected]}
                  focusedStyle={styles.itemRowFocused}
                  onPress={() => onSelectResizeMode(ResizeMode.STRETCH)}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle}>Stretch</Text>
                    <Text style={styles.itemSub}>Stretch video to fill entire screen without cropping</Text>
                  </View>
                  {resizeMode === ResizeMode.STRETCH && (
                    <View style={styles.checkedCircle}>
                      <CheckIcon color="#FFFFFF" size={12} />
                    </View>
                  )}
                </TVFocusable>
              </View>
            )}

            {/* TAB: AUDIO */}
            {activeTab === 'audio' && (
              <View style={styles.sectionWrap}>
                <Text style={styles.sectionHeader}>VOLUME & MUTE</Text>

                <TVFocusable
                  style={[styles.itemRow, isMuted && styles.itemRowSelected]}
                  focusedStyle={styles.itemRowFocused}
                  onPress={onToggleMute}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle}>{isMuted ? 'Muted (Audio Off)' : 'Audio Enabled (Volume On)'}</Text>
                    <Text style={styles.itemSub}>{isMuted ? 'Tap to unmute sound' : 'Sound playing normally'}</Text>
                  </View>
                  <View style={styles.checkedCircle}>
                    {isMuted ? <VolumeMuteIcon color="#EF4444" size={16} /> : <VolumeIcon color="#4ADE80" size={16} />}
                  </View>
                </TVFocusable>

                {!isEmbed && audioTracks.length > 0 && (
                  <>
                    <Text style={[styles.sectionHeader, { marginTop: 16 }]}>AUDIO TRACKS</Text>
                    {audioTracks.map((track, i) => {
                      const isSelected = track.index === selectedAudioIndex;
                      return (
                        <TVFocusable
                          key={'audio-' + track.index + '-' + i}
                          style={[styles.itemRow, isSelected && styles.itemRowSelected]}
                          focusedStyle={styles.itemRowFocused}
                          onPress={() => onSelectAudio(track.index)}>
                          <View style={styles.itemInfo}>
                            <Text style={styles.itemTitle}>{track.title || 'Track ' + (track.index + 1)}</Text>
                            <Text style={styles.itemSub}>
                              {track.language ? track.language.toUpperCase() : 'Default'}
                            </Text>
                          </View>
                          {isSelected && (
                            <View style={styles.checkedCircle}>
                              <CheckIcon color="#FFFFFF" size={12} />
                            </View>
                          )}
                        </TVFocusable>
                      );
                    })}
                  </>
                )}
              </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
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
    maxHeight: '82%',
    width: '100%',
    maxWidth: 680,
    paddingBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
    gap: 5,
  },
  tabBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  tabBtnFocused: {
    borderColor: '#FFFFFF',
    borderWidth: 1.5,
  },
  tabBtnText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  list: {
    paddingHorizontal: 16,
  },
  listContent: {
    paddingVertical: 12,
  },
  sectionWrap: {
    gap: 6,
  },
  sectionHeader: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
    marginTop: 4,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  itemRowSelected: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.18)',
  },
  itemRowFocused: {
    borderColor: '#FFFFFF',
    borderWidth: 1.5,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  itemSub: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  checkedCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gridPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  gridPillActive: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderColor: '#FFFFFF',
  },
  gridPillText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  gridPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
