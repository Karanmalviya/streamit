import React, { memo, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Modal,
  Image,
  ActivityIndicator,
  ToastAndroid,
  Platform,
} from 'react-native';
import { MediaItem } from '../services/tmdb';
import { WatchHistoryItem } from '../services/history';
import { CURRENT_APP_VERSION, checkForAppUpdate, UpdateInfo } from '../services/updater';
import { useDeviceMode } from '../hooks/useDeviceMode';
import { TVFocusable } from '../components/common/TVFocusable';
import {
  ProfileIcon,
  BookmarkIcon,
  PlayIcon,
  UpdateIcon,
  CheckIcon,
} from '../components/common/Icons';
import { PosterRail } from '../components/home/PosterRail';
import { HistoryRail } from '../components/home/HistoryRail';

const APP_VERSION = CURRENT_APP_VERSION.versionName;

interface ProfileScreenProps {
  watchlist: MediaItem[];
  watchHistory: WatchHistoryItem[];
  topInset: number;
  bottomInset: number;
  onSelectMedia: (item: MediaItem) => void;
  onPlayMedia?: (item: MediaItem, season?: number, episode?: number) => void;
  onOpenWatchlistModal?: () => void;
  onOpenHistoryModal?: () => void;
  onScroll?: (e: any) => void;
  onShowUpdate?: (info: UpdateInfo) => void;
}

export const ProfileScreen = memo(function ProfileScreenComponent({
  watchlist,
  watchHistory,
  topInset,
  bottomInset,
  onSelectMedia,
  onPlayMedia,
  onOpenWatchlistModal,
  onOpenHistoryModal,
  onScroll,
  onShowUpdate,
}: ProfileScreenProps) {
  const { isLandscape } = useDeviceMode();
  const [modalType, setModalType] = useState<'privacy' | 'terms' | null>(null);

  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<{
    type: 'idle' | 'checking' | 'latest' | 'available' | 'error';
    message: string;
  }>({
    type: 'idle',
    message: '',
  });

  const handleCheckUpdates = useCallback(async () => {
    if (checkingUpdate) return;
    setCheckingUpdate(true);
    setUpdateStatus({ type: 'checking', message: 'Checking for updates...' });

    try {
      const update = await checkForAppUpdate();
      if (update) {
        setUpdateStatus({
          type: 'available',
          message: `Update v${update.versionName} is ready to install!`,
        });
        if (onShowUpdate) {
          onShowUpdate(update);
        }
      } else {
        setUpdateStatus({
          type: 'latest',
          message: `App is up to date (v${CURRENT_APP_VERSION.versionName})`,
        });
        if (Platform.OS === 'android') {
          ToastAndroid.show(`App is up to date (v${CURRENT_APP_VERSION.versionName})`, ToastAndroid.SHORT);
        }
      }
    } catch {
      setUpdateStatus({
        type: 'error',
        message: 'Could not connect to update server.',
      });
    } finally {
      setCheckingUpdate(false);
    }
  }, [checkingUpdate, onShowUpdate]);

  const handleOpenPrivacy = useCallback(() => setModalType('privacy'), []);
  const handleOpenTerms = useCallback(() => setModalType('terms'), []);
  const handleCloseModal = useCallback(() => setModalType(null), []);

  const scrollPadding = React.useMemo(() => ({
    paddingTop: isLandscape ? 28 : topInset + 68,
    paddingBottom: isLandscape ? 48 : Math.max(bottomInset + 80, 100),
  }), [isLandscape, topInset, bottomInset]);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, scrollPadding]}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}>
        {/* 1. Profile Header & Stat Pills */}
        <View style={styles.headerContainer}>
          <View style={styles.profileBadge}>
            <View style={styles.avatarCircle}>
              <ProfileIcon color="#FFFFFF" size={32} filled />
            </View>
            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.profileName}>Cinema Member</Text>
                <View style={styles.statusPill}>
                  <Text style={styles.statusPillText}>LOCAL PROFILE</Text>
                </View>
              </View>
              <Text style={styles.profileSubtitle}>Personal Watchlist & History Vault</Text>
            </View>
          </View>

          {/* Stat Cards */}
          <View style={styles.statsRow}>
            <TVFocusable
              style={styles.statCard}
              focusedStyle={styles.statCardFocused}
              onPress={onOpenWatchlistModal}>
              <View style={styles.statIconBox}>
                <BookmarkIcon color="#E50914" size={18} filled />
              </View>
              <View>
                <Text style={styles.statNumber}>{watchlist.length}</Text>
                <Text style={styles.statLabel}>Watchlist Titles</Text>
              </View>
            </TVFocusable>

            <TVFocusable
              style={styles.statCard}
              focusedStyle={styles.statCardFocused}
              onPress={onOpenHistoryModal}>
              <View style={styles.statIconBox}>
                <PlayIcon color="#38BDF8" size={18} />
              </View>
              <View>
                <Text style={styles.statNumber}>{watchHistory.length}</Text>
                <Text style={styles.statLabel}>Watched Titles</Text>
              </View>
            </TVFocusable>
          </View>
        </View>

        {/* 2. Watchlist Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleWithIcon}>
              <BookmarkIcon color="#FFFFFF" size={18} filled />
              <Text style={styles.sectionTitle}>My Watchlist</Text>
              <View style={styles.badgePill}>
                <Text style={styles.badgePillText}>{watchlist.length}</Text>
              </View>
            </View>
            {watchlist.length > 0 && onOpenWatchlistModal && (
              <TVFocusable
                style={styles.seeAllBtn}
                focusedStyle={styles.seeAllBtnFocused}
                onPress={onOpenWatchlistModal}>
                <Text style={styles.seeAllBtnText}>Manage</Text>
              </TVFocusable>
            )}
          </View>

          {watchlist.length > 0 ? (
            <PosterRail
              title=""
              items={watchlist}
              railId="profile-watchlist"
              onSelectMedia={onSelectMedia}
              onViewAll={onOpenWatchlistModal}
            />
          ) : (
            <View style={styles.emptyCard}>
              <BookmarkIcon color="#64748B" size={28} />
              <Text style={styles.emptyTitle}>Watchlist is empty</Text>
              <Text style={styles.emptyDescription}>
                Tap the bookmark icon on any movie or TV series to easily track titles you want to watch.
              </Text>
            </View>
          )}
        </View>

        {/* 3. Watch History Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleWithIcon}>
              <PlayIcon color="#FFFFFF" size={18} />
              <Text style={styles.sectionTitle}>Continue Watching & History</Text>
              <View style={styles.badgePill}>
                <Text style={styles.badgePillText}>{watchHistory.length}</Text>
              </View>
            </View>
            {watchHistory.length > 0 && onOpenHistoryModal && (
              <TVFocusable
                style={styles.seeAllBtn}
                focusedStyle={styles.seeAllBtnFocused}
                onPress={onOpenHistoryModal}>
                <Text style={styles.seeAllBtnText}>View All</Text>
              </TVFocusable>
            )}
          </View>

          {watchHistory.length > 0 ? (
            <HistoryRail
              title=""
              items={watchHistory}
              onSelectMedia={onSelectMedia}
              onPlayMedia={onPlayMedia}
              onViewAll={onOpenHistoryModal}
            />
          ) : (
            <View style={styles.emptyCard}>
              <PlayIcon color="#64748B" size={28} />
              <Text style={styles.emptyTitle}>No watch history yet</Text>
              <Text style={styles.emptyDescription}>
                Any films, episodes, or anime you begin streaming will automatically appear here with progress bars.
              </Text>
            </View>
          )}
        </View>

        {/* 4. App & Updates Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleWithIcon}>
              <UpdateIcon color="#FFFFFF" size={18} />
              <Text style={styles.sectionTitle}>App & System</Text>
            </View>
          </View>

          <View style={styles.appCard}>
            <View style={styles.appCardMain}>
              <View style={styles.appCardInfo}>
                <View style={styles.appTitleRow}>
                  <Text style={styles.appCardTitle}>StreamIt Cinema</Text>
                  <View style={styles.versionBadgeInline}>
                    <Text style={styles.versionBadgeText}>v{CURRENT_APP_VERSION.versionName}</Text>
                  </View>
                </View>
                <Text style={styles.appCardSubtitle}>
                  Build #{CURRENT_APP_VERSION.versionCode} • Android Mobile & TV Dual Edition
                </Text>

                {updateStatus.type !== 'idle' && (
                  <View style={styles.statusFeedbackRow}>
                    {updateStatus.type === 'latest' && <CheckIcon color="#4ADE80" size={13} />}
                    {updateStatus.type === 'checking' && (
                      <ActivityIndicator size={12} color="#94A3B8" style={styles.checkingSpinner} />
                    )}
                    <Text
                      style={[
                        styles.statusFeedbackText,
                        updateStatus.type === 'latest' && styles.statusLatest,
                        updateStatus.type === 'available' && styles.statusAvailable,
                        updateStatus.type === 'error' && styles.statusError,
                      ]}>
                      {updateStatus.message}
                    </Text>
                  </View>
                )}
              </View>

              <TVFocusable
                style={styles.updateCheckBtn}
                focusedStyle={styles.updateCheckBtnFocused}
                onPress={handleCheckUpdates}
                disabled={checkingUpdate}>
                {checkingUpdate ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <View style={styles.updateBtnInner}>
                    <UpdateIcon color="#FFFFFF" size={15} />
                    <Text style={styles.updateCheckBtnText}>Check for Updates</Text>
                  </View>
                )}
              </TVFocusable>
            </View>
          </View>
        </View>

        {/* 5. Footer Section (Exclusively on Profile Page) */}
        <View style={styles.footerContainer}>
          <View style={styles.footerDivider} />

          <View style={styles.footerBrandRow}>
            <Image
              source={require('../assets/logo.png')}
              style={styles.footerLogo}
              resizeMode="contain"
            />
            <TVFocusable
              style={styles.versionPill}
              focusedStyle={styles.versionPillFocused}
              onPress={handleCheckUpdates}>
              <Text style={styles.versionText}>v{APP_VERSION}</Text>
            </TVFocusable>
          </View>

          <View style={styles.footerLinksRow}>
            <TVFocusable
              style={styles.footerLinkBtn}
              focusedStyle={styles.footerLinkBtnFocused}
              onPress={handleOpenPrivacy}>
              <Text style={styles.footerLinkText}>Privacy Policy</Text>
            </TVFocusable>

            <Text style={styles.footerDot}>•</Text>

            <TVFocusable
              style={styles.footerLinkBtn}
              focusedStyle={styles.footerLinkBtnFocused}
              onPress={handleOpenTerms}>
              <Text style={styles.footerLinkText}>Terms & Conditions</Text>
            </TVFocusable>
          </View>

          <Text style={styles.footerMetaText}>
            StreamIt Cinema Edition • Dual Compatible (Mobile & Android TV)
          </Text>
          <Text style={styles.footerDisclaimerText}>
            This application utilizes the TMDB API for catalog metadata and images but is not endorsed or certified by TMDB. No copyrighted video content is hosted on application servers.
          </Text>
        </View>
      </ScrollView>

      {/* 5. Privacy Policy & Terms Modal */}
      <Modal
        visible={modalType !== null}
        transparent
        animationType="fade"
        onRequestClose={handleCloseModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {modalType === 'privacy' ? 'Privacy Policy' : 'Terms & Conditions'}
              </Text>
              <TVFocusable
                style={styles.modalCloseBtn}
                focusedStyle={styles.modalCloseBtnFocused}
                hasTVPreferredFocus={true}
                onPress={handleCloseModal}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TVFocusable>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={true}>
              {modalType === 'privacy' ? (
                <View style={styles.docContainer}>
                  <Text style={styles.docHeading}>1. Zero Personal Data Collection</Text>
                  <Text style={styles.docParagraph}>
                    StreamIt operates on a strict privacy-first model. We do not require account registration, email addresses, phone numbers, or passwords. Your identity is completely anonymous.
                  </Text>

                  <Text style={styles.docHeading}>2. Local Device Storage</Text>
                  <Text style={styles.docParagraph}>
                    Your Watchlist, Watch History, and playback bookmarks are stored strictly locally on your device via AsyncStorage. No playback logs or viewing habits are transmitted or sold to any remote telemetry servers.
                  </Text>

                  <Text style={styles.docHeading}>3. Third-Party Network Calls</Text>
                  <Text style={styles.docParagraph}>
                    The app contacts The Movie Database (TMDB) API solely to retrieve public metadata, poster artwork, synopsis, and cast lists. Video streams are resolved directly from public web providers without intermediary proxies.
                  </Text>

                  <Text style={styles.docHeading}>4. Data Removal</Text>
                  <Text style={styles.docParagraph}>
                    You may clear your watch history or purge app cache at any moment directly from the device settings or the Profile page clear actions.
                  </Text>
                </View>
              ) : (
                <View style={styles.docContainer}>
                  <Text style={styles.docHeading}>1. Acceptance of Terms</Text>
                  <Text style={styles.docParagraph}>
                    By using StreamIt, you agree to these terms. This client is provided free of charge for personal, non-commercial entertainment and media organization.
                  </Text>

                  <Text style={styles.docHeading}>2. Disclaimer of Content</Text>
                  <Text style={styles.docParagraph}>
                    StreamIt does not upload, store, or manage video files on any servers. All media streams are indexed from third-party public web hosts. Users must ensure compliance with local copyright regulations in their jurisdiction.
                  </Text>

                  <Text style={styles.docHeading}>3. Intellectual Property</Text>
                  <Text style={styles.docParagraph}>
                    All movie titles, logos, promotional posters, and cast photos remain the intellectual property of their respective production studios and copyright holders.
                  </Text>

                  <Text style={styles.docHeading}>4. "As-Is" Warranty</Text>
                  <Text style={styles.docParagraph}>
                    The application is provided "as is" without warranty of any kind. The developers assume no liability for third-party stream availability, server downtime, or external web links.
                  </Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TVFocusable
                style={styles.modalDoneBtn}
                focusedStyle={styles.modalDoneBtnFocused}
                onPress={handleCloseModal}>
                <Text style={styles.modalDoneBtnText}>Dismiss</Text>
              </TVFocusable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#040406',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  headerContainer: {
    marginBottom: 24,
  },
  profileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0C0F17',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1E293B',
    borderWidth: 2,
    borderColor: '#E50914',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  statusPill: {
    backgroundColor: 'rgba(229, 9, 20, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(229, 9, 20, 0.35)',
  },
  statusPillText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#E50914',
    letterSpacing: 0.6,
  },
  profileSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 3,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A0D14',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  statCardFocused: {
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    transform: [{ scale: 1.02 }],
  },
  statIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
    letterSpacing: 0.2,
  },
  badgePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: 10,
  },
  badgePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  seeAllBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  seeAllBtnFocused: {
    backgroundColor: '#FFFFFF',
  },
  seeAllBtnText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#CBD5E1',
  },
  emptyCard: {
    backgroundColor: '#0A0D14',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#CBD5E1',
    marginTop: 10,
  },
  emptyDescription: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 17,
    maxWidth: 320,
  },
  footerContainer: {
    marginTop: 12,
    paddingTop: 20,
    alignItems: 'center',
  },
  footerDivider: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 20,
  },
  footerBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  footerLogo: {
    width: 100,
    height: 26,
  },
  versionPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  versionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E2E8F0',
    letterSpacing: 0.3,
  },
  footerLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  footerLinkBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  footerLinkBtnFocused: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  footerLinkText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    textDecorationLine: 'underline',
  },
  footerDot: {
    color: '#475569',
    fontSize: 12,
  },
  footerMetaText: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 6,
    textAlign: 'center',
  },
  footerDisclaimerText: {
    fontSize: 10,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 14,
    maxWidth: 420,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '80%',
    backgroundColor: '#0B0E17',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseBtnFocused: {
    backgroundColor: '#FFFFFF',
  },
  modalCloseText: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '700',
  },
  modalScroll: {
    padding: 20,
  },
  docContainer: {
    paddingBottom: 16,
  },
  docHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E2E8F0',
    marginTop: 12,
    marginBottom: 4,
  },
  docParagraph: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 18,
    marginBottom: 8,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'flex-end',
  },
  modalDoneBtn: {
    backgroundColor: '#E50914',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modalDoneBtnFocused: {
    backgroundColor: '#FFFFFF',
  },
  modalDoneBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12.5,
  },
  versionPillFocused: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  appCard: {
    backgroundColor: '#0C0F17',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    padding: 16,
  },
  appCardMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  appCardInfo: {
    flex: 1,
    minWidth: 200,
  },
  appTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  appCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  versionBadgeInline: {
    backgroundColor: 'rgba(229, 9, 20, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(229, 9, 20, 0.35)',
  },
  versionBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#E50914',
    letterSpacing: 0.5,
  },
  appCardSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 16,
  },
  statusFeedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  checkingSpinner: {
    marginRight: 4,
  },
  statusFeedbackText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#94A3B8',
    marginLeft: 4,
  },
  statusLatest: {
    color: '#4ADE80',
  },
  statusAvailable: {
    color: '#F59E0B',
  },
  statusError: {
    color: '#EF4444',
  },
  updateCheckBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateCheckBtnFocused: {
    backgroundColor: '#E50914',
    borderColor: '#E50914',
    transform: [{ scale: 1.03 }],
  },
  updateBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  updateCheckBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
