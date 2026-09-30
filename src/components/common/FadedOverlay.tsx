import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';

interface FadedOverlayProps {
  height: number;
}

// Ultra-smooth GPU-interpolated SVG LinearGradient to deep obsidian #040406 (Zero color mismatch line, zero gaps)
export const BillboardFadedOverlay = memo(function BillboardFadedOverlayComp({ height }: FadedOverlayProps) {
  if (height <= 0) return null;
  return (
    <View style={[styles.container, { height }]} pointerEvents="none">
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="bottomFadeObsidian" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#040406" stopOpacity="0" />
            <Stop offset="30%" stopColor="#040406" stopOpacity="0.25" />
            <Stop offset="60%" stopColor="#040406" stopOpacity="0.75" />
            <Stop offset="80%" stopColor="#040406" stopOpacity="0.97" />
            <Stop offset="90%" stopColor="#040406" stopOpacity="1" />
            <Stop offset="100%" stopColor="#040406" stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#bottomFadeObsidian)" />
      </Svg>
    </View>
  );
});

export const BillboardTopVignette = memo(function BillboardTopVignetteComp({ height = 90 }: { height?: number }) {
  if (height <= 0) return null;
  return (
    <View style={[styles.topContainer, { height }]} pointerEvents="none">
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="topVignetteObsidian" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#040406" stopOpacity="0.9" />
            <Stop offset="50%" stopColor="#040406" stopOpacity="0.4" />
            <Stop offset="100%" stopColor="#040406" stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#topVignetteObsidian)" />
      </Svg>
    </View>
  );
});

export const BillboardSideOverlay = memo(function BillboardSideOverlayComp({ width = 450 }: { width?: number }) {
  if (width <= 0) return null;
  return (
    <View style={[styles.sideContainer, { width }]} pointerEvents="none">
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="sideShadowObsidian" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor="#040406" stopOpacity="0.95" />
            <Stop offset="50%" stopColor="#040406" stopOpacity="0.5" />
            <Stop offset="100%" stopColor="#040406" stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#sideShadowObsidian)" />
      </Svg>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  topContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
  sideContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    overflow: 'hidden',
  },
});
