import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { HomeIcon, MovieIcon, TvIcon, AnimeIcon, SearchIcon } from '../common/Icons';

export type NavTab = 'home' | 'movie' | 'tv' | 'anime' | 'search';

interface BottomTabBarProps {
  currentTab: NavTab;
  onTabSelect: (tab: NavTab) => void;
  bottomInset: number;
}

interface TabButtonProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
  hasPreferredFocus?: boolean;
  children: (color: string) => React.ReactNode;
}

function TabButton({
  label,
  isActive,
  onPress,
  hasPreferredFocus = false,
  children,
}: TabButtonProps) {
  const [isFocused, setIsFocused] = useState(false);
  const iconColor = isActive || isFocused ? '#FFFFFF' : '#4E5569';

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      focusable={true}
      hasTVPreferredFocus={hasPreferredFocus}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onPress={onPress}
      style={[
        styles.tabItem,
        isFocused && styles.tabItemFocused,
      ]}>
      <View style={styles.tabIconBox}>
        {children(iconColor)}
      </View>
      <Text style={[styles.tabLabel, (isActive || isFocused) && styles.tabLabelActive]}>
        {label}
      </Text>
      {isActive && <View style={styles.tabDot} />}
    </TouchableOpacity>
  );
}

export function BottomTabBar({ currentTab, onTabSelect, bottomInset }: BottomTabBarProps) {
  return (
    <View style={[styles.bottomBar, { paddingBottom: Math.max(bottomInset, 8) }]}>
      <TabButton
        label="Home"
        isActive={currentTab === 'home'}
        onPress={() => onTabSelect('home')}
        hasPreferredFocus={currentTab === 'home'}>
        {color => <HomeIcon color={color} size={20} />}
      </TabButton>

      <TabButton
        label="Movies"
        isActive={currentTab === 'movie'}
        onPress={() => onTabSelect('movie')}>
        {color => <MovieIcon color={color} size={20} />}
      </TabButton>

      <TabButton
        label="Series"
        isActive={currentTab === 'tv'}
        onPress={() => onTabSelect('tv')}>
        {color => <TvIcon color={color} size={20} />}
      </TabButton>

      <TabButton
        label="Anime"
        isActive={currentTab === 'anime'}
        onPress={() => onTabSelect('anime')}>
        {color => <AnimeIcon color={color} size={20} />}
      </TabButton>

      <TabButton
        label="Search"
        isActive={currentTab === 'search'}
        onPress={() => onTabSelect('search')}>
        {color => <SearchIcon color={color} size={19} />}
      </TabButton>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: 'rgba(8, 9, 13, 0.96)',
    borderTopWidth: 1,
    borderTopColor: '#161824',
    paddingTop: 8,
    justifyContent: 'space-around',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 3,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  tabItemFocused: {
    backgroundColor: '#1E2336',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.06 }],
  },
  tabIconBox: {
    width: 26,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#60677D',
    marginTop: 3,
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  tabDot: {
    width: 3.5,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: '#E50914',
    marginTop: 3,
  },
});
