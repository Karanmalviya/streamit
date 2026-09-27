import React, { memo } from 'react';
import { View, Image, StyleSheet } from 'react-native';

interface TopNavbarProps {
  topInset: number;
}

export const TopNavbar = memo(function TopNavbarComponent({
  topInset,
}: TopNavbarProps) {
  return (
    <View style={[styles.navbar, { paddingTop: topInset + 6 }]}>
      <View style={styles.brandRow}>
        <Image
          source={require('../../assets/logo.png')}
          style={styles.brandLogo}
          resizeMode="contain"
        />
      </View>
    </View>
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
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: 'rgba(8, 9, 13, 0.96)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandLogo: {
    width: 120,
    height: 32,
  },
});
