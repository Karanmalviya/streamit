import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, StyleProp, ViewStyle, DimensionValue } from 'react-native';

interface SkeletonBoxProps {
  width: DimensionValue;
  height: DimensionValue;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export function SkeletonBox({
  width,
  height,
  borderRadius = 6,
  style,
}: SkeletonBoxProps) {
  const opacity = useRef(new Animated.Value(0.25)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.65,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.25,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.box,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: '#262A3B',
  },
});
