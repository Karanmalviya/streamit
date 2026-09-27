import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

interface IconProps {
  color: string;
  size?: number;
}

export function HomeIcon({ color, size = 20 }: IconProps) {
  const isFilled = color === '#FFFFFF';
  return (
    <View style={[styles.centerBottom, { width: size, height: size }]}>
      <View
        style={[
          styles.homeRoof,
          {
            borderLeftWidth: size * 0.5,
            borderRightWidth: size * 0.5,
            borderBottomWidth: size * 0.42,
            borderBottomColor: color,
          },
        ]}
      />
      <View
        style={[
          styles.homeBody,
          isFilled ? styles.homeBodyFilled : styles.homeBodyOutlined,
          {
            width: size * 0.72,
            height: size * 0.48,
            borderColor: color,
          },
          isFilled && { backgroundColor: color },
        ]}>
        <View
          style={[
            styles.homeDoor,
            {
              width: size * 0.25,
              height: size * 0.28,
            },
            isFilled ? styles.doorFilledDark : { backgroundColor: color },
          ]}
        />
      </View>
    </View>
  );
}

export function MovieIcon({ color, size = 20 }: IconProps) {
  const isFilled = color === '#FFFFFF';
  return (
    <View style={[styles.centerAll, { width: size, height: size }]}>
      <View
        style={[
          styles.clapperTop,
          isFilled ? { backgroundColor: color } : styles.clapperTopInactive,
          {
            width: size * 0.95,
            height: size * 0.32,
            borderColor: color,
          },
        ]}>
        <View style={[styles.clapperSlash, isFilled ? styles.slashDark : { backgroundColor: color }]} />
        <View style={[styles.clapperSlash, isFilled ? styles.slashDark : { backgroundColor: color }]} />
        <View style={[styles.clapperSlash, isFilled ? styles.slashDark : { backgroundColor: color }]} />
      </View>
      <View
        style={[
          styles.clapperBody,
          isFilled ? styles.clapperBodyFilled : styles.bgTransparent,
          {
            width: size * 0.95,
            height: size * 0.52,
            borderColor: color,
          },
        ]}>
        <View style={[styles.playTriangle, { borderLeftColor: color }]} />
      </View>
    </View>
  );
}

export function TvIcon({ color, size = 20 }: IconProps) {
  const isFilled = color === '#FFFFFF';
  return (
    <View style={[styles.centerAll, { width: size, height: size }]}>
      <View
        style={[
          styles.tvScreen,
          isFilled ? styles.tvScreenFilled : styles.bgTransparent,
          {
            width: size * 0.96,
            height: size * 0.65,
            borderColor: color,
          },
        ]}>
        <View style={[styles.tvInnerLine, { width: size * 0.5, backgroundColor: color }]} />
      </View>
      <View style={[styles.tvNeck, { backgroundColor: color }]} />
      <View style={[styles.tvBase, { width: size * 0.45, backgroundColor: color }]} />
    </View>
  );
}

export function AnimeIcon({ color, size = 20 }: IconProps) {
  return (
    <View style={[styles.centerAll, { width: size, height: size }]}>
      <View style={[styles.toriiTopBar, { width: size * 0.98, backgroundColor: color }]} />
      <View style={[styles.toriiSecondBar, { width: size * 0.78, backgroundColor: color }]} />
      <View style={[styles.toriiPillarsWrap, { width: size * 0.56, height: size * 0.46 }]}>
        <View style={[styles.toriiPillar, { backgroundColor: color }]} />
        <View style={[styles.toriiPillar, { backgroundColor: color }]} />
      </View>
    </View>
  );
}

export function SearchIcon({ color, size = 19 }: IconProps) {
  return (
    <View style={[styles.centerAll, { width: size, height: size }]}>
      <View
        style={[
          styles.searchLens,
          {
            width: size * 0.72,
            height: size * 0.72,
            borderRadius: (size * 0.72) / 2,
            borderColor: color,
          },
        ]}
      />
      <View
        style={[
          styles.searchHandle,
          {
            width: size * 0.36,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
}

export function BookmarkIcon({ color, size = 16, filled = false }: IconProps & { filled?: boolean }) {
  return (
    <View
      style={[
        styles.bookmark,
        filled ? { backgroundColor: color } : styles.bgTransparent,
        {
          width: size * 0.75,
          height: size,
          borderColor: color,
        },
      ]}
    />
  );
}

export function PlayIcon({ color = '#000000', size = 12 }: { color?: string; size?: number }) {
  return (
    <View
      style={[
        styles.playIconArrow,
        {
          borderTopWidth: size * 0.6,
          borderBottomWidth: size * 0.6,
          borderLeftWidth: size * 0.9,
          borderLeftColor: color,
        },
      ]}
    />
  );
}

export function PauseIcon({ color = '#FFFFFF', size = 14 }: { color?: string; size?: number }) {
  return (
    <View style={[styles.pauseWrap, { width: size, height: size }]}>
      <View style={[styles.pauseBar, { width: size * 0.28, backgroundColor: color }]} />
      <View style={[styles.pauseBar, { width: size * 0.28, backgroundColor: color }]} />
    </View>
  );
}

export function BackIcon({ color = '#FFFFFF', size = 16 }: { color?: string; size?: number }) {
  return (
    <View style={[styles.centerAll, { width: size, height: size }]}>
      <View
        style={[
          styles.backArrowHead,
          {
            width: size * 0.5,
            height: size * 0.5,
            borderColor: color,
          },
        ]}
      />
    </View>
  );
}

export function SubtitleIcon({ color = '#FFFFFF', size = 18 }: { color?: string; size?: number }) {
  return (
    <View
      style={[
        styles.centerAll,
        styles.subBorder,
        {
          width: size * 1.15,
          height: size * 0.8,
          borderColor: color,
        },
      ]}>
      <Text style={[styles.subText, { color, fontSize: size * 0.42 }]}>CC</Text>
    </View>
  );
}

export function AudioIcon({ color = '#FFFFFF', size = 18 }: { color?: string; size?: number }) {
  return (
    <View style={[styles.centerAll, { width: size, height: size }]}>
      <View
        style={[
          styles.speakerCone,
          {
            borderRightColor: color,
            borderTopWidth: size * 0.35,
            borderBottomWidth: size * 0.35,
            borderRightWidth: size * 0.4,
          },
        ]}
      />
      <View
        style={[
          styles.speakerBase,
          {
            width: size * 0.2,
            height: size * 0.35,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
}

export function Forward10Icon({ color = '#FFFFFF', size = 20 }: { color?: string; size?: number }) {
  return (
    <View style={[styles.centerAll, { flexDirection: 'row', width: size, height: size }]}>
      <View style={[styles.playIconArrow, { borderTopWidth: size * 0.4, borderBottomWidth: size * 0.4, borderLeftWidth: size * 0.5, borderLeftColor: color }]} />
      <View style={[styles.playIconArrow, { borderTopWidth: size * 0.4, borderBottomWidth: size * 0.4, borderLeftWidth: size * 0.5, borderLeftColor: color }]} />
    </View>
  );
}

export function Replay10Icon({ color = '#FFFFFF', size = 20 }: { color?: string; size?: number }) {
  return (
    <View style={[styles.centerAll, { flexDirection: 'row', width: size, height: size }]}>
      <View style={[styles.playIconArrow, { borderTopWidth: size * 0.4, borderBottomWidth: size * 0.4, borderRightWidth: size * 0.5, borderLeftWidth: 0, borderRightColor: color, marginRight: 0 }]} />
      <View style={[styles.playIconArrow, { borderTopWidth: size * 0.4, borderBottomWidth: size * 0.4, borderRightWidth: size * 0.5, borderLeftWidth: 0, borderRightColor: color }]} />
    </View>
  );
}

export function PlusIcon({ color = '#FFFFFF', size = 14 }: { color?: string; size?: number }) {
  return (
    <View style={[styles.centerAll, { width: size, height: size }]}>
      <View style={[styles.plusHorizontal, { width: size, backgroundColor: color }]} />
      <View style={[styles.plusVertical, { height: size, backgroundColor: color }]} />
    </View>
  );
}

export function VolumeIcon({ color = '#FFFFFF', size = 18 }: { color?: string; size?: number }) {
  return (
    <View style={[styles.centerAll, styles.rowLayout, { width: size, height: size }]}>
      <View style={[styles.speakerBase, { width: size * 0.22, height: size * 0.38, backgroundColor: color }]} />
      <View style={[styles.speakerCone, { borderTopWidth: size * 0.32, borderBottomWidth: size * 0.32, borderRightWidth: size * 0.32, borderRightColor: color }]} />
      <View style={[styles.speakerWave, { width: size * 0.18, height: size * 0.44, borderColor: color }]} />
    </View>
  );
}

export function VolumeMuteIcon({ color = '#FFFFFF', size = 18 }: { color?: string; size?: number }) {
  return (
    <View style={[styles.centerAll, styles.rowLayout, { width: size, height: size }]}>
      <View style={[styles.speakerBase, { width: size * 0.22, height: size * 0.38, backgroundColor: color }]} />
      <View style={[styles.speakerCone, { borderTopWidth: size * 0.32, borderBottomWidth: size * 0.32, borderRightWidth: size * 0.32, borderRightColor: color }]} />
      <Text style={[styles.speakerMuteCross, { color, fontSize: size * 0.65 }]}>×</Text>
    </View>
  );
}

export function CheckIcon({ color = '#4ADE80', size = 14 }: { color?: string; size?: number }) {
  return (
    <View style={[styles.centerAll, { width: size, height: size }]}>
      <View
        style={[
          styles.checkMark,
          {
            width: size * 0.75,
            height: size * 0.4,
            borderColor: color,
          },
        ]}
      />
    </View>
  );
}

export function CCIcon({ color = '#FFFFFF', size = 18 }: { color?: string; size?: number }) {
  return (
    <View
      style={[
        styles.centerAll,
        styles.ccBox,
        {
          width: size * 1.25,
          height: size * 0.85,
          borderColor: color,
        },
      ]}>
      <Text style={[styles.ccText, { color, fontSize: size * 0.55 }]}>CC</Text>
    </View>
  );
}

export function SettingsIcon({ color = '#FFFFFF', size = 18 }: { color?: string; size?: number }) {
  return (
    <View style={[styles.centerAll, { width: size, height: size }]}>
      <View style={[styles.settingsOuter, { width: size * 0.85, height: size * 0.85, borderColor: color }]}>
        <View style={[styles.settingsInner, { width: size * 0.35, height: size * 0.35, backgroundColor: color }]} />
      </View>
    </View>
  );
}

export function EpisodesIcon({ color = '#FFFFFF', size = 18 }: { color?: string; size?: number }) {
  return (
    <View style={[styles.centerAll, styles.episodesWrap, { width: size, height: size }]}>
      <View style={[styles.epLine, { backgroundColor: color, width: size * 0.9, height: 2 }]} />
      <View style={[styles.epLine, { backgroundColor: color, width: size * 0.9, height: 2 }]} />
      <View style={[styles.epLine, { backgroundColor: color, width: size * 0.6, height: 2 }]} />
    </View>
  );
}


export function FullscreenIcon({ color = '#FFFFFF', size = 16 }: { color?: string; size?: number }) {
  return (
    <View style={[styles.centerAll, { width: size, height: size }]}>
      <View style={[styles.fsCornerTL, { borderColor: color, width: size * 0.38, height: size * 0.38 }]} />
      <View style={[styles.fsCornerTR, { borderColor: color, width: size * 0.38, height: size * 0.38 }]} />
      <View style={[styles.fsCornerBL, { borderColor: color, width: size * 0.38, height: size * 0.38 }]} />
      <View style={[styles.fsCornerBR, { borderColor: color, width: size * 0.38, height: size * 0.38 }]} />
    </View>
  );
}

export function ExitFullscreenIcon({ color = '#FFFFFF', size = 16 }: { color?: string; size?: number }) {
  return (
    <View style={[styles.centerAll, { width: size, height: size }]}>
      <View style={[styles.efsCornerTL, { borderColor: color, width: size * 0.38, height: size * 0.38 }]} />
      <View style={[styles.efsCornerTR, { borderColor: color, width: size * 0.38, height: size * 0.38 }]} />
      <View style={[styles.efsCornerBL, { borderColor: color, width: size * 0.38, height: size * 0.38 }]} />
      <View style={[styles.efsCornerBR, { borderColor: color, width: size * 0.38, height: size * 0.38 }]} />
    </View>
  );
}


export function ChevronDownIcon({ color = '#FFFFFF', size = 12 }: { color?: string; size?: number }) {
  return (
    <View style={[styles.centerAll, { width: size, height: size }]}>
      <View
        style={[
          styles.chevronDown,
          {
            width: size * 0.6,
            height: size * 0.6,
            borderLeftColor: color,
            borderBottomColor: color,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bgTransparent: {
    backgroundColor: 'transparent',
  },
  homeBodyFilled: {
    borderWidth: 0,
  },
  homeBodyOutlined: {
    borderWidth: 1.8,
    backgroundColor: 'transparent',
  },
  doorFilledDark: {
    backgroundColor: '#08090D',
  },
  clapperTopInactive: {
    backgroundColor: '#181A24',
  },
  slashDark: {
    backgroundColor: '#08090D',
  },
  clapperBodyFilled: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  tvScreenFilled: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  centerAll: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerBottom: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  homeRoof: {
    width: 0,
    height: 0,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  homeBody: {
    borderTopWidth: 0,
    borderBottomLeftRadius: 2.5,
    borderBottomRightRadius: 2.5,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  homeDoor: {
    borderTopLeftRadius: 1.5,
    borderTopRightRadius: 1.5,
  },
  clapperTop: {
    borderRadius: 2.5,
    borderWidth: 1.5,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    marginBottom: 1.5,
  },
  clapperSlash: {
    width: 2.5,
    height: '70%',
    transform: [{ rotate: '25deg' }],
  },
  clapperBody: {
    borderWidth: 1.6,
    borderRadius: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playTriangle: {
    width: 0,
    height: 0,
    borderTopWidth: 3.5,
    borderBottomWidth: 3.5,
    borderLeftWidth: 5.5,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    marginLeft: 1.5,
  },
  tvScreen: {
    borderRadius: 3,
    borderWidth: 1.7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tvInnerLine: {
    height: 1.5,
    opacity: 0.45,
    borderRadius: 1,
  },
  tvNeck: {
    width: 2,
    height: 2,
  },
  tvBase: {
    height: 1.8,
    borderRadius: 1,
  },
  toriiTopBar: {
    height: 2.2,
    borderRadius: 1,
  },
  toriiSecondBar: {
    height: 1.6,
    marginTop: 2.2,
    borderRadius: 0.5,
  },
  toriiPillarsWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 1.2,
  },
  toriiPillar: {
    width: 2.2,
    height: '100%',
    borderRadius: 0.5,
  },
  searchLens: {
    borderWidth: 2,
    position: 'absolute',
    top: 1,
    left: 1,
  },
  searchHandle: {
    position: 'absolute',
    bottom: 1.5,
    right: 1.5,
    height: 2.2,
    borderRadius: 1.2,
    transform: [{ rotate: '45deg' }],
  },
  bookmark: {
    borderWidth: 1.8,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  playIconArrow: {
    width: 0,
    height: 0,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    marginLeft: 2,
  },
  pauseWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pauseBar: {
    height: '100%',
    borderRadius: 1.5,
  },
  backArrowHead: {
    borderLeftWidth: 2.2,
    borderBottomWidth: 2.2,
    transform: [{ rotate: '45deg' }],
    marginLeft: 4,
  },
  subBorder: {
    borderWidth: 1.8,
    borderRadius: 3,
  },
  subText: {
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  skipText: {
    fontWeight: '700',
  },
  plusHorizontal: {
    height: 1.8,
  },
  plusVertical: {
    width: 1.8,
    position: 'absolute',
  },
  
  fsCornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderTopWidth: 2,
    borderLeftWidth: 2,
  },
  fsCornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    borderTopWidth: 2,
    borderRightWidth: 2,
  },
  fsCornerBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
  },
  fsCornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderBottomWidth: 2,
    borderRightWidth: 2,
  },
  efsCornerTL: {
    position: 'absolute',
    top: 2,
    left: 2,
    borderBottomWidth: 2,
    borderRightWidth: 2,
  },
  efsCornerTR: {
    position: 'absolute',
    top: 2,
    right: 2,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
  },
  efsCornerBL: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    borderTopWidth: 2,
    borderRightWidth: 2,
  },
  efsCornerBR: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    borderTopWidth: 2,
    borderLeftWidth: 2,
  },

  
  chevronDown: {
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    transform: [{ rotate: '-45deg' }],
    marginTop: -3,
  },

  checkMark: {
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    transform: [{ rotate: '-45deg' }],
    marginTop: -2,
  },

  rowLayout: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  speakerBase: {
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
  },
  speakerCone: {
    width: 0,
    height: 0,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  speakerWave: {
    borderRightWidth: 2,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    marginLeft: 2,
  },
  speakerMuteCross: {
    fontWeight: '900',
    marginLeft: 2,
    marginTop: -2,
  },
  ccBox: {
    borderWidth: 1.5,
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ccText: {
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  settingsOuter: {
    borderWidth: 1.8,
    borderRadius: 12,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsInner: {
    borderRadius: 8,
  },
  episodesWrap: {
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  epLine: {
    borderRadius: 1,
  },
});