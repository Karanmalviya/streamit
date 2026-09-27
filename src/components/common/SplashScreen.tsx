import React, { useEffect, useRef, memo } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
} from 'react-native';

interface SplashScreenProps {
  isReady: boolean;
  onFinish?: () => void;
}

export const SplashScreen = memo(function SplashScreenComponent({
  isReady,
  onFinish,
}: SplashScreenProps) {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Intro animation: smooth scale + fade in
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [logoOpacity, logoScale]);

  useEffect(() => {
    if (isReady) {
      // Outro animation: smooth fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 350,
        delay: 200,
        useNativeDriver: true,
      }).start(() => {
        onFinish?.();
      });
    }
  }, [isReady, fadeAnim, onFinish]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]} pointerEvents="none">
      <StatusBar barStyle="light-content" />
      <View style={styles.centerWrap}>
        <Animated.Image
          source={require('../../assets/logo.png')}
          style={[
            styles.logo,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
          resizeMode="contain"
        />
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="small" color="#E50914" />
        </View>
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#08090D',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  centerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 220,
    height: 64,
  },
  loaderWrap: {
    marginTop: 28,
  },
});
