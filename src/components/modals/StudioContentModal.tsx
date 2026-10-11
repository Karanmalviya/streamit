import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  Image,
  StyleSheet,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  MediaItem,
  StudioInfo,
  fetchStudioContent,
} from '../../services/tmdb';
import { TVFocusable } from '../common/TVFocusable';
import { PosterGrid } from '../catalog/PosterGrid';
import { useDeviceMode } from '../../hooks/useDeviceMode';
import { tvNavigation } from '../../services/tvNavigation';

interface StudioContentModalProps {
  visible: boolean;
  studio: StudioInfo | null;
  onClose: () => void;
  onSelectMedia: (item: MediaItem) => void;
}

function BackArrowIcon({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
  const headSize = size * 0.46;
  return (
    <View style={[styles.arrowContainer, { width: size, height: size }]}>
      <View
        style={[
          styles.arrowStem,
          {
            width: size * 0.78,
            height: 2.2,
            backgroundColor: color,
          },
        ]}
      />
      <View
        style={[
          styles.arrowHead,
          {
            width: headSize,
            height: headSize,
            borderLeftColor: color,
            borderBottomColor: color,
          },
        ]}
      />
    </View>
  );
}

export function StudioContentModal({
  visible,
  studio,
  onClose,
  onSelectMedia,
}: StudioContentModalProps) {
  const insets = useSafeAreaInsets();
  const { isTV, isLandscape } = useDeviceMode();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [_page, setPage] = useState(1);
  const [logoError, setLogoError] = useState(false);

  const isFetchingMoreRef = React.useRef(false);
  const pageRef = React.useRef(1);
  const [hasMore, setHasMore] = useState(true);

  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0
  );

  const loadStudioItems = useCallback(
    async (targetPage = 1, append = false) => {
      if (!studio) return;
      if (append && isFetchingMoreRef.current) return;
      if (append) isFetchingMoreRef.current = true;
      try {
        if (!append) {
          setLoading(true);
          setHasMore(true);
          pageRef.current = 1;
        } else {
          setLoadingMore(true);
        }

        let res: MediaItem[] = [];
        if (!append) {
          const [p1, p2] = await Promise.all([
            fetchStudioContent(studio, 1),
            fetchStudioContent(studio, 2),
          ]);
          const seen = new Set<number>();
          res = [...p1, ...p2].filter(item => {
            if (seen.has(item.id)) return false;
            seen.add(item.id);
            return true;
          });
          pageRef.current = p2.length > 0 ? 2 : 1;
          setPage(pageRef.current);
        } else {
          res = await fetchStudioContent(studio, targetPage);
          pageRef.current = targetPage;
          setPage(targetPage);
        }

        if (res.length === 0) {
          setHasMore(false);
        }
        if (append) {
          setItems(prev => {
            const seen = new Set(prev.map(i => i.id));
            const fresh = res.filter(i => !seen.has(i.id));
            return [...prev, ...fresh];
          });
        } else {
          setItems(res);
        }
      } catch (err) {
        console.warn('Failed to load studio items:', err);
      } finally {
        isFetchingMoreRef.current = false;
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [studio]
  );

  const backBtnRef = useRef<any>(null);

  useEffect(() => {
    if (visible && studio) {
      tvNavigation.setModalOpen(true);
      setPage(1);
      setItems([]);
      setLogoError(false);
      loadStudioItems(1, false);
      const timer = setTimeout(() => {
        backBtnRef.current?.focus?.();
      }, 60);
      return () => {
        clearTimeout(timer);
        tvNavigation.setModalOpen(false);
      };
    } else {
      tvNavigation.setModalOpen(false);
    }
  }, [visible, studio, loadStudioItems]);

  if (!visible || !studio) return null;

  const isWide = isTV || isLandscape;

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.root}>
        {/* Studio Branded Minimal Header with Safe Area Inset */}
        <View
          style={[
            styles.header,
            { paddingTop: topInset + (isWide ? 10 : 8) },
            isWide && styles.headerWide,
          ]}>
          <TVFocusable
            ref={backBtnRef}
            style={[styles.backBtn, isWide && styles.backBtnWide]}
            focusedStyle={styles.btnFocused}
            hasTVPreferredFocus={true}
            onPress={onClose}>
            <BackArrowIcon size={isWide ? 20 : 18} color="#FFFFFF" />
          </TVFocusable>

          <View style={styles.logoWrap}>
            {studio.logoUrl && !logoError ? (
              <Image
                source={{ uri: studio.logoUrl }}
                style={[
                  styles.headerLogoImg,
                  isWide && styles.headerLogoImgWide,
                ]}
                resizeMode="contain"
                onError={() => setLogoError(true)}
              />
            ) : (
              <Text style={[styles.brandTitle, { color: studio.color || '#FFFFFF' }]}>
                {studio.name}
              </Text>
            )}
          </View>
        </View>

        {/* Content Poster Grid */}
        <View style={styles.contentWrap}>
          {loading && items.length === 0 ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={studio.color || '#FFFFFF'} />
              <Text style={styles.loadingText}>Loading {studio.name} titles...</Text>
            </View>
          ) : (
            <PosterGrid
              items={items}
              loading={loading}
              refreshing={refreshing}
              loadingMore={loadingMore}
              onRefresh={() => {
                setRefreshing(true);
                loadStudioItems(1, false);
              }}
              onLoadMore={() => {
                if (!loading && !loadingMore && !isFetchingMoreRef.current && hasMore && items.length >= 10) {
                  loadStudioItems(pageRef.current + 1, true);
                }
              }}
              onSelectMedia={item => {
                onClose();
                onSelectMedia(item);
              }}
              emptyText={`No titles currently found for ${studio.name}`}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#040406',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#07080D',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerWide: {
    paddingHorizontal: 28,
    paddingBottom: 16,
    gap: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  backBtnWide: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  btnFocused: {
    borderColor: '#FFFFFF',
    borderWidth: 2,
    transform: [{ scale: 1.1 }],
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  arrowContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  arrowStem: {
    position: 'absolute',
    right: 2,
    borderRadius: 1,
  },
  arrowHead: {
    position: 'absolute',
    left: 2,
    borderLeftWidth: 2.2,
    borderBottomWidth: 2.2,
    transform: [{ rotate: '45deg' }],
  },
  logoWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  headerLogoImg: {
    width: 140,
    height: 38,
    alignSelf: 'flex-start',
  },
  headerLogoImgWide: {
    width: 180,
    height: 46,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  contentWrap: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
});

