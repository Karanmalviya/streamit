import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
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
import { StreamSource } from '../../services/providers';

export interface CleanQualityOption {
  tier: '4K' | '1080p' | '720p' | '480p' | 'Embed';
  label: string;
  source: StreamSource;
  isNative: boolean;
}

export interface PlayerSettingsModalProps {
  visible: boolean;
  isEmbed: boolean;
  playbackSpeed: number;
  resizeMode: ResizeMode;
  isMuted: boolean;
  autoSkipIntro?: boolean;
  audioTracks: AudioTrackOption[];
  subtitleTracks: SubtitleTrackOption[];
  qualityOptions?: CleanQualityOption[];
  currentSource?: StreamSource;
  selectedAudioIndex: number;
  selectedSubtitleIndex: number;
  subtitleSize: number;
  subtitleOffset: number;
  initialTab?: SettingsTab;
  onClose: () => void;
  onSelectSpeed: (speed: number) => void;
  onSelectResizeMode: (mode: ResizeMode) => void;
  onToggleMute: () => void;
  onToggleAutoSkipIntro?: () => void;
  onSelectAudio: (index: number) => void;
  onSelectSubtitle: (index: number) => void;
  onSelectSubtitleSize: (size: number) => void;
  onSelectSubtitleOffset: (offset: number) => void;
  onSelectSource?: (source: StreamSource) => void;
}

export type SettingsTab = 'quality' | 'subtitles' | 'playback' | 'audio' | 'display';

export function PlayerSettingsModal({
  visible,
  isEmbed,
  playbackSpeed,
  resizeMode,
  isMuted,
  autoSkipIntro = false,
  audioTracks,
  subtitleTracks,
  qualityOptions = [],
  currentSource,
  selectedAudioIndex,
  selectedSubtitleIndex,
  subtitleSize,
  subtitleOffset,
  initialTab = 'quality',
  onClose,
  onSelectSpeed,
  onSelectResizeMode,
  onToggleMute,
  onToggleAutoSkipIntro,
  onSelectAudio,
  onSelectSubtitle,
  onSelectSubtitleSize,
  onSelectSubtitleOffset,
  onSelectSource,
}: PlayerSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab || 'quality');
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  // Sync initial tab when modal opens
  React.useEffect(() => {
    if (visible && initialTab) {
      setActiveTab(initialTab);
    }
  }, [visible, initialTab]);

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
      <View style={[styles.backdrop, isLandscape && { backgroundColor: 'transparent' }]}>
        <TouchableOpacity
          style={styles.dismissOverlay}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[
          styles.sheet,
          isLandscape && { 
            maxWidth: '100%', 
            maxHeight: '100%',
            height: '100%', 
            backgroundColor: 'rgba(15, 23, 42, 0.9)', 
            borderWidth: 0, 
            paddingBottom: 0,
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            paddingHorizontal: 60,
          }
        ]}>
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
            {qualityOptions.length > 0 && (
              <TVFocusable
                style={[styles.tabBtn, activeTab === 'quality' && styles.tabBtnActive]}
                focusedStyle={styles.tabBtnFocused}
                onPress={() => setActiveTab('quality')}>
                <Text style={[styles.tabBtnText, activeTab === 'quality' && styles.tabBtnTextActive]}>
                  Quality
                </Text>
              </TVFocusable>
            )}

            <TVFocusable
              style={[styles.tabBtn, activeTab === 'subtitles' && styles.tabBtnActive]}
              focusedStyle={styles.tabBtnFocused}
              onPress={() => setActiveTab('subtitles')}>
              <Text style={[styles.tabBtnText, activeTab === 'subtitles' && styles.tabBtnTextActive]}>
                Subtitles
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
                Aspect
              </Text>
            </TVFocusable>

            <TVFocusable
              style={[styles.tabBtn, activeTab === 'audio' && styles.tabBtnActive]}
              focusedStyle={styles.tabBtnFocused}
              onPress={() => setActiveTab('audio')}>
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

            {/* TAB: VIDEO STREAM QUALITY */}
            {activeTab === 'quality' && (
              <View style={styles.sectionWrap}>

                {qualityOptions.map((opt) => {
                  const isSelected = currentSource?.id === opt.source.id;
                  return (
                    <TVFocusable
                      key={'qual-' + opt.tier + '-' + opt.source.id}
                      hasTVPreferredFocus={isSelected}
                      style={[styles.itemRow, isSelected && styles.itemRowSelected]}
                      focusedStyle={styles.itemRowFocused}
                      onPress={() => {
                        onSelectSource && onSelectSource(opt.source);
                        onClose();
                      }}>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemTitle}>{opt.label}</Text>
                        
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

            {/* TAB: SUBTITLES & CLOSED CAPTIONS */}
            {activeTab === 'subtitles' && (
              <View style={styles.sectionWrap}>

                {/* Subtitle Track Items */}
                <TVFocusable
                  hasTVPreferredFocus={selectedSubtitleIndex === -1}
                  style={[styles.itemRow, selectedSubtitleIndex === -1 && styles.itemRowSelected]}
                  focusedStyle={styles.itemRowFocused}
                  onPress={() => onSelectSubtitle(-1)}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle}>Off</Text>
                    
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

                <TVFocusable
                  style={[styles.itemRow, resizeMode === ResizeMode.CONTAIN && styles.itemRowSelected]}
                  focusedStyle={styles.itemRowFocused}
                  onPress={() => onSelectResizeMode(ResizeMode.CONTAIN)}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle}>Contain</Text>
                    
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
                    <Text style={styles.itemTitle}>Cover</Text>
                    
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
                {!isEmbed && audioTracks.length > 0 && (
                  <>

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
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: '#FFFFFF',
  },
  tabBtnFocused: {
    backgroundColor: 'rgba(255,255,255,0.1)',
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
  },
  itemRowSelected: {
  },
  itemRowFocused: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
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
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderColor: 'transparent',
  },
  gridPillActive: {
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
  qualityTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qualityBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  qualityBadge4K: {
    backgroundColor: '#9333EA',
  },
  qualityBadge1080: {
    backgroundColor: '#E50914',
  },
  qualityBadgeStandard: {
    backgroundColor: '#3B82F6',
  },
  qualityBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});



