import React, { useState, memo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  Platform,
} from 'react-native';
import { TVFocusable } from '../common/TVFocusable';
import { useDeviceMode } from '../../hooks/useDeviceMode';

export interface LanguageItem {
  code: string;
  name: string;
  nativeName?: string;
  imageUrl: string;
  color: string;
}

export const POPULAR_LANGUAGES: LanguageItem[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    imageUrl: 'https://api.bingr.one/static/categories/1526660-a-afdd1ecfd8ae.webp',
    color: '#7F1D1D',
  },
  {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本',
    imageUrl: 'https://api.bingr.one/static/categories/1750233039896-a.webp',
    color: '#713F12',
  },
  {
    code: 'ko',
    name: 'Korean',
    nativeName: '한국어',
    imageUrl: 'https://api.bingr.one/static/categories/1526670-a-ec8fb58a5fb8.webp',
    color: '#1E1B4B',
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    imageUrl: 'https://api.bingr.one/static/categories/1526661-a-00b818b5bc0e.webp',
    color: '#312E81',
  },
  {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    imageUrl: 'https://api.bingr.one/static/portuguese.webp',
    color: '#064E3B',
  },
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    imageUrl: 'https://api.bingr.one/static/spanish.webp',
    color: '#78350F',
  },
  {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    imageUrl: 'https://api.bingr.one/static/categories/1526682-a-fd4e220ba563.webp',
    color: '#831843',
  },
  {
    code: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    imageUrl: 'https://api.bingr.one/static/categories/1526685-a-5f5995a53f61.webp',
    color: '#14532D',
  },
  {
    code: 'kn',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    imageUrl: 'https://api.bingr.one/static/categories/1781241136059-a.webp',
    color: '#701A75',
  },
  {
    code: 'ml',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    imageUrl: 'https://api.bingr.one/static/categories/1526672-a-eafe6913c6c8.webp',
    color: '#164E63',
  },
  {
    code: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    imageUrl: 'https://api.bingr.one/static/categories/1526674-a-fdd5233a7699.webp',
    color: '#9A3412',
  },
  {
    code: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    imageUrl: 'https://api.bingr.one/static/categories/1526659-a-7271cf19114e.webp',
    color: '#4C1D95',
  },
];

interface LanguageRailProps {
  onSelectLanguage: (lang: LanguageItem) => void;
  onViewAll?: () => void;
}

interface LanguageCardItemProps {
  lang: LanguageItem;
  isTV: boolean;
  onSelect: (lang: LanguageItem) => void;
}

const LanguageCardItem = memo(function LanguageCardItem({
  lang,
  isTV,
  onSelect,
}: LanguageCardItemProps) {
  const [imgError, setImgError] = useState(false);

  const handlePress = useCallback(() => {
    onSelect(lang);
  }, [lang, onSelect]);

  return (
    <TVFocusable
      style={[styles.card, isTV && styles.cardTV]}
      focusedStyle={styles.cardFocused}
      onPress={handlePress}>
      <View style={[styles.cardInner, { backgroundColor: lang.color }]}>
        {!imgError && lang.imageUrl ? (
          <Image
            source={{ uri: lang.imageUrl }}
            style={styles.cardImage}
            resizeMode="cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <View style={styles.fallbackContainer}>
            <Text style={styles.fallbackText}>{lang.nativeName || lang.name}</Text>
          </View>
        )}
      </View>
    </TVFocusable>
  );
});

export const LanguageRail = memo(function LanguageRail({
  onSelectLanguage,
  onViewAll,
}: LanguageRailProps) {
  const { isTV } = useDeviceMode();

  const renderItem = useCallback(
    ({ item }: { item: LanguageItem }) => (
      <LanguageCardItem
        lang={item}
        isTV={isTV}
        onSelect={onSelectLanguage}
      />
    ),
    [isTV, onSelectLanguage]
  );

  const keyExtractor = useCallback(
    (item: LanguageItem) => `lang-${item.code}`,
    []
  );

  const cardWidth = isTV ? 216 + 16 : 172 + 12;
  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: cardWidth,
      offset: cardWidth * index,
      index,
    }),
    [cardWidth]
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Popular Languages</Text>
        {onViewAll && (
          <TVFocusable
            style={styles.viewAllBtn}
            focusedStyle={styles.viewAllBtnFocused}
            onPress={onViewAll}>
            <Text style={styles.viewAllText}>View All &gt;</Text>
          </TVFocusable>
        )}
      </View>

      <FlatList
        horizontal
        data={POPULAR_LANGUAGES}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, isTV && styles.scrollTV]}
        initialNumToRender={5}
        maxToRenderPerBatch={4}
        windowSize={3}
        removeClippedSubviews={Platform.OS === 'android'}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginTop: 22,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  viewAllBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  viewAllBtnFocused: {
    backgroundColor: '#FFFFFF',
    transform: [{ scale: 1.08 }],
  },
  viewAllText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  scroll: {
    paddingHorizontal: 16,
  },
  scrollTV: {
    paddingHorizontal: 28,
  },
  card: {
    width: 172,
    height: 96,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#111520',
    marginRight: 12,
  },
  cardTV: {
    width: 216,
    height: 116,
    borderRadius: 14,
    marginRight: 16,
  },
  cardInner: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
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
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  fallbackText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  cardFocused: {
    borderColor: '#FFFFFF',
    borderWidth: 2.5,
    transform: [{ scale: 1.06 }],
    elevation: 12,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
});
