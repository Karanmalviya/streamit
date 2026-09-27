import React, { useState } from 'react';
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

function GenreGridCard({
  genre,
  isTV,
  onPress,
}: {
  genre: GenreItem;
  isTV: boolean;
  onPress: () => void;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <TVFocusable
      style={[styles.genreCard, isTV && styles.genreCardTV]}
      focusedStyle={styles.cardFocused}
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
}

function LanguageGridCard({
  lang,
  isTV,
  onPress,
}: {
  lang: LanguageItem;
  isTV: boolean;
  onPress: () => void;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <TVFocusable
      style={[styles.genreCard, isTV && styles.genreCardTV]}
      focusedStyle={styles.cardFocused}
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
}

function StudioGridCard({
  studio,
  isTV,
  onPress,
}: {
  studio: StudioInfo;
  isTV: boolean;
  onPress: () => void;
}) {
  const [errCount, setErrCount] = useState(0);
  const currentUri = errCount === 0 ? studio.logoUrl : errCount === 1 ? studio.webFallbackUrl : null;

  return (
    <TVFocusable
      style={[styles.studioCard, isTV && styles.studioCardTV]}
      focusedStyle={styles.cardFocused}
      onPress={onPress}>
      <View style={styles.studioInner}>
        {currentUri ? (
          <Image
            source={{ uri: currentUri }}
            style={[styles.studioLogo, { tintColor: '#FFFFFF' }]}
            resizeMode="contain"
            onError={() => setErrCount(prev => prev + 1)}
          />
        ) : (
          <Text style={[styles.fallbackText, { color: studio.color || '#FFFFFF' }]}>
            {studio.name}
          </Text>
        )}
      </View>
    </TVFocusable>
  );
}

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

  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0
  );

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
            style={[styles.backBtn, isWide && styles.backBtnWide]}
            focusedStyle={styles.btnFocused}
            hasTVPreferredFocus={true}
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
              {POPULAR_GENRES.map(genre => (
                <GenreGridCard
                  key={`all-genre-${genre.id}`}
                  genre={genre}
                  isTV={isTV}
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
              {POPULAR_LANGUAGES.map(lang => (
                <LanguageGridCard
                  key={`all-lang-${lang.code}`}
                  lang={lang}
                  isTV={isTV}
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
              {POPULAR_STUDIOS.map(studio => (
                <StudioGridCard
                  key={`all-studio-${studio.id}`}
                  studio={studio}
                  isTV={isTV}
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
    backgroundColor: '#07090E',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#0D1017',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
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
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#111520',
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
  studioCard: {
    width: '47.5%',
    height: 90,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#0F121A',
  },
  studioCardTV: {
    width: '23%',
    height: 104,
    borderRadius: 16,
  },
  studioInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  studioLogo: {
    width: '100%',
    height: '100%',
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
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  cardFocused: {
    borderColor: '#FFFFFF',
    borderWidth: 2.5,
    transform: [{ scale: 1.05 }],
    elevation: 10,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
});
