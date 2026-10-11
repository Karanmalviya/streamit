import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { HomeIcon, MovieIcon, TvIcon, AnimeIcon, SearchIcon, ProfileIcon } from '../common/Icons';
import { useDeviceMode } from '../../hooks/useDeviceMode';
import { TVFocusable } from '../common/TVFocusable';
import { tvNavigation } from '../../services/tvNavigation';

export type NavTab = 'home' | 'movie' | 'tv' | 'anime' | 'search' | 'profile';

interface BottomTabBarProps {
  currentTab: NavTab;
  onTabSelect: (tab: NavTab) => void;
  bottomInset: number;
}

function renderTabIcon(tab: NavTab, color: string, active: boolean, isLandscape: boolean) {
  switch (tab) {
    case 'home':
      return <HomeIcon color={color} size={isLandscape ? 19 : 22} filled={active} />;
    case 'movie':
      return <MovieIcon color={color} size={isLandscape ? 19 : 22} filled={active} />;
    case 'tv':
      return <TvIcon color={color} size={isLandscape ? 19 : 22} filled={active} />;
    case 'anime':
      return <AnimeIcon color={color} size={isLandscape ? 19 : 22} filled={active} />;
    case 'search':
      return <SearchIcon color={color} size={isLandscape ? 18 : 21} filled={active} />;
    case 'profile':
      return <ProfileIcon color={color} size={isLandscape ? 19 : 22} filled={active} />;
  }
}

interface TabButtonProps {
  tabKey: NavTab;
  label: string;
  isActive: boolean;
  isLandscape?: boolean;
  onPress: () => void;
  onPressUp?: () => void;
  onPressDown?: () => void;
  onPressLeft?: () => void;
  onPressRight?: () => void;
  nextFocusDown?: number;
  nextFocusUp?: number;
  nextFocusLeft?: number;
  nextFocusRight?: number;
  onFocus: (key: NavTab) => void;
  onBlur: (key: NavTab) => void;
  onLayout?: () => void;
}

const TabButton = React.forwardRef<any, TabButtonProps>(({
  tabKey,
  label,
  isActive,
  isLandscape,
  onPress,
  onPressUp,
  onPressDown,
  onPressLeft,
  onPressRight,
  nextFocusDown,
  nextFocusUp,
  nextFocusLeft,
  nextFocusRight,
  onFocus,
  onBlur,
  onLayout,
}, ref) => {
  const [isFocusedLocal, setIsFocusedLocal] = useState(false);
  const activeOrFocused = isActive || isFocusedLocal;
  const iconColor = activeOrFocused ? '#FFFFFF' : '#64748B';

  const handleFocus = () => {
    setIsFocusedLocal(true);
    onFocus(tabKey);
  };
  const handleBlur = () => {
    setIsFocusedLocal(false);
    onBlur(tabKey);
  };

  return (
    <TVFocusable
      ref={ref}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onLayout={onLayout}
      onPress={onPress}
      onPressUp={onPressUp}
      onPressDown={onPressDown}
      onPressLeft={onPressLeft}
      onPressRight={onPressRight}
      nextFocusDown={nextFocusDown}
      nextFocusUp={nextFocusUp}
      nextFocusLeft={nextFocusLeft}
      nextFocusRight={nextFocusRight}
      style={[
        styles.tabItem,
        isLandscape && styles.tabItemSide,
      ]}
      focusedStyle={styles.tabItemFocused}
      focusRingStyle={styles.tabFocusRing}
      scaleOnFocus={false}
      activeOpacity={0.75}
      borderRadius={12}>
      <View style={[styles.tabIconBox, isActive && styles.tabIconBoxActive]}>
        {renderTabIcon(tabKey, iconColor, isActive, !!isLandscape)}
      </View>
      <Text
        style={[
          styles.tabLabel,
          activeOrFocused && styles.tabLabelActive,
        ]}>
        {label}
      </Text>
      {isActive && <View style={styles.tabDot} />}
    </TVFocusable>
  );
});

export const SIDEBAR_WIDTH = 58;

const TAB_ORDER: NavTab[] = ['home', 'movie', 'tv', 'anime', 'search', 'profile'];
const TAB_LABELS: Record<NavTab, string> = {
  home: 'Home',
  movie: 'Movies',
  tv: 'Series',
  anime: 'Anime',
  search: 'Search',
  profile: 'Profile',
};

export function BottomTabBar({ currentTab, onTabSelect, bottomInset }: BottomTabBarProps) {
  const { isLandscape, isTV } = useDeviceMode();

  const homeRef = useRef<any>(null);
  const movieRef = useRef<any>(null);
  const tvRef = useRef<any>(null);
  const animeRef = useRef<any>(null);
  const searchRef = useRef<any>(null);
  const profileRef = useRef<any>(null);

  const tabRefs: Record<NavTab, React.RefObject<any>> = {
    home: homeRef,
    movie: movieRef,
    tv: tvRef,
    anime: animeRef,
    search: searchRef,
    profile: profileRef,
  };

  const [handles, setHandles] = useState<Record<NavTab, number | undefined>>({
    home: undefined,
    movie: undefined,
    tv: undefined,
    anime: undefined,
    search: undefined,
    profile: undefined,
  });

  const updateHandles = useCallback(() => {
    const newHandles: Record<NavTab, number | undefined> = {
      home: homeRef.current?.getNodeHandle?.() || undefined,
      movie: movieRef.current?.getNodeHandle?.() || undefined,
      tv: tvRef.current?.getNodeHandle?.() || undefined,
      anime: animeRef.current?.getNodeHandle?.() || undefined,
      search: searchRef.current?.getNodeHandle?.() || undefined,
      profile: profileRef.current?.getNodeHandle?.() || undefined,
    };
    setHandles(prev => {
      let changed = false;
      for (const tab of TAB_ORDER) {
        if (prev[tab] !== newHandles[tab]) {
          changed = true;
          break;
        }
      }
      return changed ? newHandles : prev;
    });
  }, []);

  useEffect(() => {
    tvNavigation.setActiveTab(currentTab);
  }, [currentTab]);

  useEffect(() => {
    if (homeRef.current) tvNavigation.registerSidebarTab('home', homeRef.current);
    if (movieRef.current) tvNavigation.registerSidebarTab('movie', movieRef.current);
    if (tvRef.current) tvNavigation.registerSidebarTab('tv', tvRef.current);
    if (animeRef.current) tvNavigation.registerSidebarTab('anime', animeRef.current);
    if (searchRef.current) tvNavigation.registerSidebarTab('search', searchRef.current);
    if (profileRef.current) tvNavigation.registerSidebarTab('profile', profileRef.current);

    const t1 = setTimeout(updateHandles, 60);
    const t2 = setTimeout(updateHandles, 250);
    const t3 = setTimeout(updateHandles, 600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      tvNavigation.unregisterSidebarTab('home');
      tvNavigation.unregisterSidebarTab('movie');
      tvNavigation.unregisterSidebarTab('tv');
      tvNavigation.unregisterSidebarTab('anime');
      tvNavigation.unregisterSidebarTab('search');
      tvNavigation.unregisterSidebarTab('profile');
    };
  }, [updateHandles]);

  const handleFocus = (key: NavTab) => {
    tvNavigation.setFocusedSidebar(key, tabRefs[key].current);
  };

  const handleBlur = (_key: NavTab) => {
    // handled locally in TabButton
  };

  const focusPrev = (tab: NavTab) => {
    const idx = TAB_ORDER.indexOf(tab);
    if (idx > 0) {
      const prevTab = TAB_ORDER[idx - 1];
      tabRefs[prevTab].current?.focus?.();
    }
  };

  const focusNext = (tab: NavTab) => {
    const idx = TAB_ORDER.indexOf(tab);
    if (idx < TAB_ORDER.length - 1) {
      const nextTab = TAB_ORDER[idx + 1];
      tabRefs[nextTab].current?.focus?.();
    }
  };

  const handleTabPress = (tab: NavTab) => {
    onTabSelect(tab);
    if (isLandscape) {
      // On TV, pressing OK on a tab transfers focus into the main content
      setTimeout(() => {
        tvNavigation.focusContent();
      }, 80);
    }
  };

  const handlePressRight = useCallback(() => {
    tvNavigation.focusContent();
  }, []);

  return (
    <View
      style={[
        styles.bottomBar,
        isLandscape
          ? styles.sideBar
          : [
              !isTV && styles.bottomBarMobile,
              { paddingBottom: Math.max(bottomInset, 8) },
            ],
      ]}>
      {TAB_ORDER.map((tab, idx) => {
        const selfHandle = handles[tab];
        const prevTab = idx > 0 ? TAB_ORDER[idx - 1] : null;
        const nextTab = idx < TAB_ORDER.length - 1 ? TAB_ORDER[idx + 1] : null;

        const prevHandle = prevTab ? handles[prevTab] : selfHandle;
        const nextHandle = nextTab ? handles[nextTab] : selfHandle;
        const hasHandles = Boolean(selfHandle);

        return (
          <TabButton
            key={tab}
            ref={tabRefs[tab]}
            tabKey={tab}
            label={TAB_LABELS[tab]}
            isActive={currentTab === tab}
            isLandscape={isLandscape}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onLayout={updateHandles}
            onPress={() => handleTabPress(tab)}
            nextFocusUp={isLandscape ? (prevHandle || selfHandle) : undefined}
            nextFocusDown={isLandscape ? (nextHandle || selfHandle) : undefined}
            nextFocusLeft={isLandscape ? selfHandle : undefined}
            nextFocusRight={undefined}
            onPressUp={isLandscape ? (!hasHandles && idx > 0 ? () => focusPrev(tab) : undefined) : () => focusPrev(tab)}
            onPressDown={isLandscape ? (!hasHandles && idx < TAB_ORDER.length - 1 ? () => focusNext(tab) : undefined) : undefined}
            onPressLeft={isLandscape ? undefined : () => focusPrev(tab)}
            onPressRight={isLandscape ? handlePressRight : () => focusNext(tab)}
          />
        );
      })}
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
    zIndex: 100,
  },
  bottomBarMobile: {
    left: 2,
    right: 2,
  },
  sideBar: {
    top: 0,
    left: 0,
    right: undefined,
    width: SIDEBAR_WIDTH,
    flexDirection: 'column',
    borderTopWidth: 0,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: 20,
    paddingBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 12,
  },
  tabItemSide: {
    flex: 0,
    width: 48,
    height: 52,
    paddingVertical: 0,
    paddingHorizontal: 0,
    marginBottom: 2,
  },
  tabItemFocused: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    transform: [{ scale: 1.08 }],
  },
  tabFocusRing: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 12,
  },
  tabIconBox: {
    width: 26,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabIconBoxActive: {
    transform: [{ scale: 1.05 }],
  },
  tabLabel: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
    letterSpacing: 0.1,
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
    marginTop: 2,
  },
});
