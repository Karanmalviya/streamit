import { useWindowDimensions, Platform } from 'react-native';

export interface DeviceMode {
  width: number;
  height: number;
  isLandscape: boolean;
  isTV: boolean;
  gridColumns: number;
}

export function useDeviceMode(): DeviceMode {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isTV = Platform.isTV || (isLandscape && width >= 900);

  // Responsive columns: 3 on mobile portrait, 5 on tablet/TV landscape
  const gridColumns = isTV || width >= 900 ? 6 : isLandscape || width >= 600 ? 4 : 3;

  return {
    width,
    height,
    isLandscape,
    isTV,
    gridColumns,
  };
}
