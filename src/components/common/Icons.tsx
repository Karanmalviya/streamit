import React from 'react';
import Svg, {
  Path,
  Rect,
  Circle,
  Polygon,
  Line,
  Polyline,
} from 'react-native-svg';

export interface IconProps {
  color?: string;
  size?: number;
  filled?: boolean;
}

// 1. Home Icon (Lucide / Apple SF style with smart active fill)
export function HomeIcon({ color = '#FFFFFF', size = 22, filled = false }: IconProps) {
  const isFilled = filled || color === '#FFFFFF';
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9.5L12 2.5L21 9.5V20C21 20.5523 20.5523 21 20 21H15C14.4477 21 14 20.5523 14 20V14C14 13.4477 13.5523 13 13 13H11C10.4477 13 10 13.4477 10 14V20C10 20.5523 9.55228 21 9 21H4C3.44772 21 3 20.5523 3 20V9.5Z"
        fill={isFilled ? color : 'none'}
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// 2. Movies Icon (Cinematic Clapperboard with detailed slashes)
export function MovieIcon({ color = '#FFFFFF', size = 22, filled = false }: IconProps) {
  const isFilled = filled || color === '#FFFFFF';
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Slate Top */}
      <Path
        d="M20.2 6.5L3.8 11.2C3.1 11.4 2.4 11 2.2 10.3L1.5 7.8C1.3 7.1 1.7 6.4 2.4 6.2L18.8 1.5C19.5 1.3 20.2 1.7 20.4 2.4L21.1 4.9C21.3 5.6 20.9 6.3 20.2 6.5Z"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M6.5 5.5L9.5 9.5" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
      <Path d="M12.5 3.8L15.5 7.8" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
      {/* Slate Body */}
      <Rect
        x="3"
        y="11"
        width="18"
        height="10"
        rx="2"
        fill={isFilled ? color : 'none'}
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Play indicator in body */}
      <Polygon
        points="10,13.5 15,16 10,18.5"
        fill={isFilled ? '#08090D' : color}
      />
    </Svg>
  );
}

// 3. TV / Series Icon (Modern Slim Bezel Smart TV with Stand)
export function TvIcon({ color = '#FFFFFF', size = 22, filled = false }: IconProps) {
  const isFilled = filled || color === '#FFFFFF';
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Screen Monitor */}
      <Rect
        x="2"
        y="4"
        width="20"
        height="13"
        rx="2"
        fill={isFilled ? color : 'none'}
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Stand Neck & Base */}
      <Path d="M12 17V20" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M8 20H16" stroke={color} strokeWidth={2} strokeLinecap="round" />
      {/* Screen Antenna / Signal accent if inactive */}
      {!isFilled && (
        <Path d="M7 10.5H17" stroke={color} strokeWidth={1.2} strokeOpacity={0.4} strokeLinecap="round" />
      )}
      {/* Active Screen inner accent */}
      {isFilled && (
        <Rect x="5" y="7" width="14" height="7" rx="1" fill="#08090D" fillOpacity={0.3} />
      )}
    </Svg>
  );
}

// 4. Anime Icon (Iconic Torii Shrine Gate with curved canopy)
export function AnimeIcon({ color = '#FFFFFF', size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Top curved lintel (Kasagi) */}
      <Path
        d="M2 4C8 2.5 16 2.5 22 4"
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
      />
      {/* Upper straight beam (Shimaki) */}
      <Path
        d="M3.5 6.5H20.5"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      {/* Lower cross tie beam (Nuki) */}
      <Path
        d="M5 10H19"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      {/* Left and Right Pillars (Hashira) */}
      <Path
        d="M7 6.5V21M17 6.5V21"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
      />
      {/* Center Top Gakuzuka */}
      <Path
        d="M12 6.5V10"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

// 5. Search Icon (High-precision magnifying lens)
export function SearchIcon({ color = '#FFFFFF', size = 20 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle
        cx="11"
        cy="11"
        r="7"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M20.5 20.5L16.2 16.2"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// 6. Bookmark / Watchlist Icon
export function BookmarkIcon({ color = '#FFFFFF', size = 18, filled = false }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 21L12 16.5L5 21V5C5 3.89543 5.89543 3 7 3H17C18.1046 3 19 3.89543 19 5V21Z"
        fill={filled ? color : 'none'}
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// 7. Play Icon
export function PlayIcon({ color = '#FFFFFF', size = 16 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polygon
        points="6 4 20 12 6 20 6 4"
        fill={color}
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// 8. Pause Icon
export function PauseIcon({ color = '#FFFFFF', size = 16 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="5" y="4" width="4.5" height="16" rx="1.5" fill={color} />
      <Rect x="14.5" y="4" width="4.5" height="16" rx="1.5" fill={color} />
    </Svg>
  );
}

// 9. Back Navigation Icon (Chevron Left)
export function BackIcon({ color = '#FFFFFF', size = 20 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 19L8 12L15 5"
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// 10. Volume / Speaker On Icon (Modern Outline with Soundwaves)
export function VolumeIcon({ color = '#FFFFFF', size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polygon
        points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M15.5 8.5C16.5 9.5 17 10.7 17 12C17 13.3 16.5 14.5 15.5 15.5"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M19 5C20.9 6.9 22 9.3 22 12C22 14.7 20.9 17.1 19 19"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// 11. Volume Mute / Speaker Off Icon (Modern Outline with X)
export function VolumeMuteIcon({ color = '#FFFFFF', size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polygon
        points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line
        x1="22"
        y1="9"
        x2="16"
        y2="15"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line
        x1="16"
        y1="9"
        x2="22"
        y2="15"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// 12. Replay 10 Seconds Icon
export function Replay10Icon({ color = '#FFFFFF', size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 12C3 7.03 7.03 3 12 3C16.97 3 21 7.03 21 12C21 16.97 16.97 21 12 21C8.25 21 5.06 18.7 3.73 15.4"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Polyline points="3 4 3 10 9 10" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {/* 10 text center */}
      <Path d="M9.5 10V15M13.5 10H15.5C16.05 10 16.5 10.45 16.5 11V14C16.5 14.55 16.05 15 15.5 15H13.5C12.95 15 12.5 14.55 12.5 14V11C12.5 10.45 12.95 10 13.5 10Z" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// 13. Forward 10 Seconds Icon
export function Forward10Icon({ color = '#FFFFFF', size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 12C21 7.03 16.97 3 12 3C7.03 3 3 7.03 3 12C3 16.97 7.03 21 12 21C15.75 21 18.94 18.7 20.27 15.4"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Polyline points="21 4 21 10 15 10" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {/* 10 text center */}
      <Path d="M8.5 10V15M12.5 10H14.5C15.05 10 15.5 10.45 15.5 11V14C15.5 14.55 15.05 15 14.5 15H12.5C11.95 15 11.5 14.55 11.5 14V11C11.5 10.45 11.95 10 12.5 10Z" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// 14. Closed Captions (CC) Icon
export function CCIcon({ color = '#FFFFFF', size = 20 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="4" width="20" height="16" rx="3" stroke={color} strokeWidth={1.8} />
      <Path
        d="M10 9.5C9.5 9 8.8 8.8 8 9C6.9 9.3 6 10.5 6 12C6 13.5 6.9 14.7 8 15C8.8 15.2 9.5 15 10 14.5"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Path
        d="M18 9.5C17.5 9 16.8 8.8 16 9C14.9 9.3 14 10.5 14 12C14 13.5 14.9 14.7 16 15C16.8 15.2 17.5 15 18 14.5"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

// 15. Subtitle Icon
export function SubtitleIcon({ color = '#FFFFFF', size = 20 }: IconProps) {
  return <CCIcon color={color} size={size} />;
}

// 16. Audio Track Icon
export function AudioIcon({ color = '#FFFFFF', size = 20 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18V5L21 3V16" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="6" cy="18" r="3" stroke={color} strokeWidth={2} fill={color} />
      <Circle cx="18" cy="16" r="3" stroke={color} strokeWidth={2} fill={color} />
    </Svg>
  );
}

// 17. Settings (Gear) Icon
export function SettingsIcon({ color = '#FFFFFF', size = 20 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={2} />
      <Path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// 18. Episodes / Playlist Icon
export function EpisodesIcon({ color = '#FFFFFF', size = 20 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 6H20M4 12H20M4 18H13" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
    </Svg>
  );
}

// 19. Fullscreen Icon
export function FullscreenIcon({ color = '#FFFFFF', size = 18 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// 20. Exit Fullscreen Icon
export function ExitFullscreenIcon({ color = '#FFFFFF', size = 18 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 14h6m0 0v6m0-6L3 21m17-7h-6m0 0v6m0-6l7 7M4 10h6m0 0V4m0 6L3 3m17 7h-6m0 0V4m0 6l7-7" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// 21. Chevron Down Icon
export function ChevronDownIcon({ color = '#FFFFFF', size = 16 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9L12 15L18 9" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// 22. Checkmark Icon
export function CheckIcon({ color = '#4ADE80', size = 16 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline points="20 6 9 17 4 12" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// 23. Plus Icon
export function PlusIcon({ color = '#FFFFFF', size = 16 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5V19M5 12H19" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
    </Svg>
  );
}

// 24. Share Icon
export function ShareIcon({ color = '#FFFFFF', size = 18 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="18" cy="5" r="3" stroke={color} strokeWidth={2} />
      <Circle cx="6" cy="12" r="3" stroke={color} strokeWidth={2} />
      <Circle cx="18" cy="19" r="3" stroke={color} strokeWidth={2} />
      <Line x1="8.59" y1="13.51" x2="15.42" y2="17.49" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Line x1="15.41" y1="6.51" x2="8.59" y2="10.49" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}