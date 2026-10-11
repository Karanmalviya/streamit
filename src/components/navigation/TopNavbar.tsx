import React, { memo, useRef, useEffect } from 'react';
import { View, Image, StyleSheet, Animated } from 'react-native';
import { useDeviceMode } from '../../hooks/useDeviceMode';

import { PlayIcon, BookmarkIcon } from '../common/Icons';
import { TVFocusable } from '../common/TVFocusable';
import { SIDEBAR_WIDTH } from './BottomTabBar';

interface TopNavbarProps {
  topInset: number;
  visible?: boolean;
  onOpenHistory?: () => void;
  onOpenWatchlist?: () => void;
}

export const TopNavbar = memo(function TopNavbarComponent({
  topInset,
  visible = true,
  onOpenHistory,
  onOpenWatchlist,
}: TopNavbarProps) {
  const translateY = useRef(new Animated.Value(0)).current;
  const { isLandscape, isTV } = useDeviceMode();

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: visible ? 0 : -(topInset + 64),
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [visible, topInset, translateY]);

  return (
    <Animated.View
      style={[
        styles.navbar,
        isLandscape
          ? styles.navbarLandscape
          : !isTV
          ? styles.navbarMobile
          : undefined,
        {
          paddingTop: topInset + 12,
          transform: [{ translateY }],
        },
      ]}>
      <View style={styles.brandRow}>
        <Image
          source={require('../../assets/logo.png')}
          style={styles.brandLogo}
          resizeMode="contain"
        />
      </View>
      <View style={styles.actionRow}>
        {onOpenHistory && (
          <TVFocusable
            style={styles.iconBtn}
            focusedStyle={styles.iconBtnFocused}
            onPress={onOpenHistory}>
            <PlayIcon color="#FFFFFF" size={20} />
          </TVFocusable>
        )}
        {onOpenWatchlist && (
          <TVFocusable
            style={styles.iconBtn}
            focusedStyle={styles.iconBtnFocused}
            onPress={onOpenWatchlist}>
            <BookmarkIcon color="#FFFFFF" size={20} />
          </TVFocusable>
        )}
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  navbar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: 'rgba(4, 4, 6, 0.96)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  navbarLandscape: {
    left: SIDEBAR_WIDTH,
    right: 0,
  },
  navbarMobile: {
    left: 2,
    right: 2,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandLogo: {
    width: 130,
    height: 34,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBtnFocused: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});
