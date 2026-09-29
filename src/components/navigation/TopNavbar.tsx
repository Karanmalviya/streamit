import React, { memo, useRef, useEffect } from 'react';
import { View, Image, StyleSheet, Animated } from 'react-native';

interface TopNavbarProps {
  topInset: number;
  visible?: boolean;
}

export const TopNavbar = memo(function TopNavbarComponent({
  topInset,
  visible = true,
}: TopNavbarProps) {
  const translateY = useRef(new Animated.Value(0)).current;

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
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: 'rgba(4, 4, 6, 0.96)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandLogo: {
    width: 130,
    height: 34,
  },
});
