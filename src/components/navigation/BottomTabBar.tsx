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
  children: (color: string, active: boolean) => React.ReactNode;
}

function TabButton({
  label,
  isActive,
  onPress,
  hasPreferredFocus = false,
  children,
}: TabButtonProps) {
  const [isFocused, setIsFocused] = useState(false);
  const activeOrFocused = isActive || isFocused;
  const iconColor = activeOrFocused ? '#FFFFFF' : '#64748B';

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      focusable={true}
      hasTVPreferredFocus={hasPreferredFocus}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onPress={onPress}
      style={[
        styles.tabItem,
        isFocused && styles.tabItemFocused,
      ]}>
      <View style={[styles.tabIconBox, isActive && styles.tabIconBoxActive]}>
        {children(iconColor, isActive)}
      </View>
      <Text
        style={[
          styles.tabLabel,
          activeOrFocused && styles.tabLabelActive,
        ]}>
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
        {(color, active) => <HomeIcon color={color} size={22} filled={active} />}
      </TabButton>

      <TabButton
        label="Movies"
        isActive={currentTab === 'movie'}
        onPress={() => onTabSelect('movie')}>
        {(color, active) => <MovieIcon color={color} size={22} filled={active} />}
      </TabButton>

      <TabButton
        label="Series"
        isActive={currentTab === 'tv'}
        onPress={() => onTabSelect('tv')}>
        {(color, active) => <TvIcon color={color} size={22} filled={active} />}
      </TabButton>

      <TabButton
        label="Anime"
        isActive={currentTab === 'anime'}
        onPress={() => onTabSelect('anime')}>
        {(color, active) => <AnimeIcon color={color} size={22} filled={active} />}
      </TabButton>

      <TabButton
        label="Search"
        isActive={currentTab === 'search'}
        onPress={() => onTabSelect('search')}>
        {(color, active) => <SearchIcon color={color} size={21} filled={active} />}
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
    backgroundColor: '#040406',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: 8,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  tabItemFocused: {
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.08 }],
  },
  tabIconBox: {
    width: 28,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabIconBoxActive: {
    transform: [{ scale: 1.05 }],
  },
  tabLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 3,
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  tabDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E50914',
    marginTop: 3,
  },
});
