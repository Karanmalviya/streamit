import React, { memo } from 'react';
import { View, Image, StyleSheet } from 'react-native';

interface FadedOverlayProps {
  height: number;
}

// Ultra-smooth GPU-interpolated lossless 128-step vertical shadow fade to #08090D (No visible stepping or lines)
const BOTTOM_FADE_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAACACAYAAADK+QP0AAAA8klEQVR4nG3EO0RFAQAA0Nf/ver1Tx+VUkpKSpKSJEkSSRJJIpFEIhKJSEREIiIiIiIiIhoioiGiIaIhGqIhGqKhnOUudYYTCkeiodDfYv4pNiguKD4oIShRSQoHRZSsFKUqqjSlK0OZylK2cpSrPOWrQIUqUrFKVKoylatClapStWpUqzrVq0GNalKzWtSqNrWrQ53qUrd61Ks+9WtAgxrSsEY0qjGNa0KTmtK0ZjSrOc1rQYta0rJWtKo1rWtDm9rStna0qz3t60CHOtKxTnSqM53rQpe60rVudKs73etBj3rSs170qje960Of+tK3fn4BdnU8rnAnfA0AAAAASUVORK5CYII=';

// Ultra-smooth top vignette shadow
const TOP_VIGNETTE_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAABACAYAAADbER1AAAAAk0lEQVR4nFXEP4vBAQAA0N903SWDxWSxWCwWi8ViMVgMFoPBYjAY1A0GgzIopQxKV0pJSemSJCLOv4+lt6h7wws+v8LP4F+Pd3fddNWfLjrrpKMO2munrTZa61crLbXQXDNNNdGPxhppqIH66qmrjtpq6VtNNVRXTVVVVFZJRRWUV05ZZZRWSkklFFdMUUUU0oeCF+fkJ4eia067AAAAAElFTkSuQmCC';

// Ultra-smooth horizontal side shadow for TV / widescreen
const SIDE_SHADOW_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAAABCAYAAAAW0qa2AAABS0lEQVR4nG3Qz2cXABzG8dFhz3u8DyM6RIwRO0RERERkxIiRiMiIRCISSUwkiUliMjMzk0zSTLJJKaWUSj+0fm611Vbb/oR9Dt/DDjs89+f1bgqurLPlNVtas/+N/QsuNrbQ2N/gn+B8Y3PB38FfwdngTPBn8Efwe/Bb8GvwS3A6+Dn4Kfgx+CH4Pvgu+Db4Jvg6+Cr4Mvgi+Dz4LPg0+CT4OPgo+DA4FZwMPgjeD04Ex4P3gneDd4JjwdvBW8HR4EhwODgUHAwOBG8G+4M3gteD14J9wavBK8HLwUvBi8He4IXg+eC54NngmeDp4KlqebK6nahWx6vPserSU02OVosj1eBw8FDZDwa7y3ugrF3l3F/GzjLuK9/esu0p1+7grjLtLM+O4PaybCtHR3BrGdqDbfV/S3Bzfd8U3Fi/W4PW55Zgc/3dUH+bVgE/wVwF2TLm5wAAAABJRU5ErkJggg==';

export const BillboardFadedOverlay = memo(function BillboardFadedOverlayComp({ height }: FadedOverlayProps) {
  if (height <= 0) return null;
  return (
    <View style={[styles.container, { height }]} pointerEvents="none">
      <Image
        source={{ uri: BOTTOM_FADE_PNG }}
        style={StyleSheet.absoluteFill}
        resizeMode="stretch"
      />
    </View>
  );
});

export const BillboardTopVignette = memo(function BillboardTopVignetteComp({ height = 90 }: { height?: number }) {
  if (height <= 0) return null;
  return (
    <View style={[styles.topContainer, { height }]} pointerEvents="none">
      <Image
        source={{ uri: TOP_VIGNETTE_PNG }}
        style={StyleSheet.absoluteFill}
        resizeMode="stretch"
      />
    </View>
  );
});

export const BillboardSideOverlay = memo(function BillboardSideOverlayComp({ width = 450 }: { width?: number }) {
  if (width <= 0) return null;
  return (
    <View style={[styles.sideContainer, { width }]} pointerEvents="none">
      <Image
        source={{ uri: SIDE_SHADOW_PNG }}
        style={StyleSheet.absoluteFill}
        resizeMode="stretch"
      />
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
