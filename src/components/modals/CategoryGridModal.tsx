import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  Image,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TVFocusable } from '../common/TVFocusable';
import { useDeviceMode } from '../../hooks/useDeviceMode';
import { tvNavigation } from '../../services/tvNavigation';
import { GenreItem, POPULAR_GENRES } from '../home/GenreRail';
import { LanguageItem, POPULAR_LANGUAGES } from '../home/LanguageRail';
import { StudioInfo, POPULAR_STUDIOS } from '../../services/tmdb';

export type CategoryGridType = 'genres' | 'languages' | 'studios';

interface CategoryGridModalProps {
  visible: boolean;
  type: CategoryGridType;
  onClose: () => void;
  onSelectGenre?: (genre: GenreItem) => void;
  onSelectLanguage?: (lang: LanguageItem) => void;
  onSelectStudio?: (studio: StudioInfo) => void;
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

const GenreGridCard = React.forwardRef<any, {
  genre: GenreItem;
  index: number;
  isTV: boolean;
  onPress: () => void;
  onPressUp?: () => void;
}>(function GenreGridCard({ genre, isTV, onPress, onPressUp }, ref) {
  const [imgError, setImgError] = useState(false);

  return (
    <TVFocusable
      ref={ref}
      style={[styles.genreCard, isTV && styles.genreCardTV]}
      focusedStyle={styles.cardFocused}
      onPressUp={onPressUp}
      onPress={onPress}>
      <View style={[styles.genreInner, { backgroundColor: genre.color }]}>
        {!imgError && genre.imageUrl ? (
          <Image
            source={{ uri: genre.imageUrl }}
            style={styles.cardImage}
            resizeMode="cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <Text style={styles.fallbackText}>{genre.name}</Text>
        )}
      </View>
    </TVFocusable>
  );
});

const LanguageGridCard = React.forwardRef<any, {
  lang: LanguageItem;
  index: number;
  isTV: boolean;
  onPress: () => void;
  onPressUp?: () => void;
}>(function LanguageGridCard({ lang, isTV, onPress, onPressUp }, ref) {
  const [imgError, setImgError] = useState(false);

  return (
    <TVFocusable
      ref={ref}
      style={[styles.genreCard, isTV && styles.genreCardTV]}
      focusedStyle={styles.cardFocused}
      onPressUp={onPressUp}
      onPress={onPress}>
      <View style={[styles.genreInner, { backgroundColor: lang.color }]}>
        {!imgError && lang.imageUrl ? (
          <Image
            source={{ uri: lang.imageUrl }}
            style={styles.cardImage}
            resizeMode="cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <Text style={styles.fallbackText}>{lang.nativeName || lang.name}</Text>
        )}
      </View>
    </TVFocusable>
  );
});

const StudioGridCard = React.forwardRef<any, {
  studio: StudioInfo;
  index: number;
  isTV: boolean;
  onPress: () => void;
  onPressUp?: () => void;
}>(function StudioGridCard({ studio, isTV, onPress, onPressUp }, ref) {
  const [errCount, setErrCount] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const currentUri = errCount === 0 ? studio.logoUrl : errCount === 1 ? studio.webFallbackUrl : null;

  const isAppIcon =
    studio.isAppIcon ??
    ['netflix', 'disney', 'jiohotstar', 'prime', 'appletv', 'hulu', 'paramount', 'peacock', 'crunchyroll', 'zee5', 'sonyliv', 'starz'].includes(
      studio.id
    );

  return (
    <View style={[styles.studioItemWrap, isTV && styles.studioItemWrapTV]}>
      <TVFocusable
        ref={ref}
        style={[
          styles.studioCard,
          isTV && styles.studioCardTV,
          { backgroundColor: studio.bgColor || '#000000' },
        ]}
        focusedStyle={styles.cardFocused}
        borderRadius={isTV ? 20 : 16}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onPressUp={onPressUp}
        onPress={onPress}>
        {currentUri ? (
          isAppIcon ? (
            <Image
              source={{ uri: currentUri }}
              style={styles.studioLogo}
              resizeMode="cover"
              onError={() => setErrCount(prev => prev + 1)}
            />
          ) : (
            <View style={[styles.logoPaddedWrap, isTV && styles.logoPaddedWrapTV]}>
              <Image
                source={{ uri: currentUri }}
                style={styles.studioLogoContain}
                resizeMode="contain"
                onError={() => setErrCount(prev => prev + 1)}
              />
            </View>
          )
        ) : (
          <View style={[styles.fallbackWrap, { backgroundColor: studio.bgColor || '#161922' }]}>
            <Text style={[styles.fallbackText, { color: studio.color || '#FFFFFF' }]}>
              {studio.logoText || studio.name}
            </Text>
          </View>
        )}
      </TVFocusable>
      <Text
        style={[styles.studioLabel, isTV && styles.studioLabelTV, isFocused && styles.studioLabelFocused]}
        numberOfLines={1}>
        {studio.name}
      </Text>
    </View>
  );
});

export function CategoryGridModal({
  visible,
  type,
  onClose,
  onSelectGenre,
  onSelectLanguage,
  onSelectStudio,
}: CategoryGridModalProps) {
  const insets = useSafeAreaInsets();
  const { isTV, isLandscape } = useDeviceMode();
  const backBtnRef = useRef<any>(null);
  const firstItemRef = useRef<any>(null);

  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0
  );

  useEffect(() => {
    if (visible) {
      tvNavigation.setModalOpen(true);
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
  }, [visible]);

  if (!visible) return null;

  const isWide = isTV || isLandscape;

  const title =
    type === 'genres'
      ? 'All Genres'
      : type === 'languages'
      ? 'All Languages'
      : 'All Channels & Studios';

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.root}>
        {/* Header with Safe Area Inset */}
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
            onPressDown={() => firstItemRef.current?.focus?.()}
            onPress={onClose}>
            <BackArrowIcon size={isWide ? 20 : 18} color="#FFFFFF" />
          </TVFocusable>

          <View style={styles.titleWrap}>
            <Text style={styles.titleText}>{title}</Text>
          </View>
        </View>

        {/* Grid Content */}
        <ScrollView
          contentContainerStyle={[
            styles.gridContent,
            isWide && styles.gridContentWide,
          ]}
          showsVerticalScrollIndicator={false}>
          {type === 'genres' && (
            <View style={styles.gridRow}>
              {POPULAR_GENRES.map((genre, index) => (
                <GenreGridCard
                  key={`all-genre-${genre.id}`}
                  ref={index === 0 ? firstItemRef : undefined}
                  genre={genre}
                  index={index}
                  isTV={isTV}
                  onPressUp={index === 0 ? () => backBtnRef.current?.focus?.() : undefined}
                  onPress={() => {
                    onClose();
                    onSelectGenre?.(genre);
                  }}
                />
              ))}
            </View>
          )}

          {type === 'languages' && (
            <View style={styles.gridRow}>
              {POPULAR_LANGUAGES.map((lang, index) => (
                <LanguageGridCard
                  key={`all-lang-${lang.code}`}
                  ref={index === 0 ? firstItemRef : undefined}
                  lang={lang}
                  index={index}
                  isTV={isTV}
                  onPressUp={index === 0 ? () => backBtnRef.current?.focus?.() : undefined}
                  onPress={() => {
                    onClose();
                    onSelectLanguage?.(lang);
                  }}
                />
              ))}
            </View>
          )}

          {type === 'studios' && (
            <View style={styles.gridRow}>
              {POPULAR_STUDIOS.map((studio, index) => (
                <StudioGridCard
                  key={`all-studio-${studio.id}`}
                  ref={index === 0 ? firstItemRef : undefined}
                  studio={studio}
                  index={index}
                  isTV={isTV}
                  onPressUp={index < 4 ? () => backBtnRef.current?.focus?.() : undefined}
                  onPress={() => {
                    onClose();
                    onSelectStudio?.(studio);
                  }}
                />
              ))}
            </View>
          )}
        </ScrollView>
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
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  gridContent: {
    padding: 16,
    paddingBottom: 40,
  },
  gridContentWide: {
    padding: 28,
    paddingBottom: 60,
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    justifyContent: 'space-between',
  },
  genreCard: {
    width: '47.5%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    backgroundColor: '#07080D',
  },
  genreCardTV: {
    width: '23%',
    borderRadius: 14,
  },
  genreInner: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  studioItemWrap: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 16,
  },
  studioItemWrapTV: {
    width: '18%',
    marginBottom: 20,
  },
  studioCard: {
    width: 80,
    height: 80,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#000000',
  },
  studioCardTV: {
    width: 96,
    height: 96,
    borderRadius: 20,
  },
  studioLogo: {
    width: '100%',
    height: '100%',
  },
  logoPaddedWrap: {
    flex: 1,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoPaddedWrapTV: {
    padding: 14,
  },
  studioLogoContain: {
    width: '100%',
    height: '100%',
  },
  studioLabel: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    textAlign: 'center',
    width: '100%',
  },
  studioLabelTV: {
    fontSize: 13,
    marginTop: 10,
  },
  studioLabelFocused: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  fallbackWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
  },
  cardImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  fallbackText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
  },
  cardFocused: {
    zIndex: 10,
  },
});
