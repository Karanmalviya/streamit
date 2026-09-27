import React, { useState } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';

interface TVFocusableProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  focusedStyle?: StyleProp<ViewStyle>;
  hasTVPreferredFocus?: boolean;
  activeOpacity?: number;
  scaleOnFocus?: boolean;
  disabled?: boolean;
}

export function TVFocusable({
  children,
  onPress,
  style,
  focusedStyle,
  hasTVPreferredFocus = false,
  activeOpacity = 0.8,
  scaleOnFocus = true,
  disabled = false,
}: TVFocusableProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <TouchableOpacity
      activeOpacity={activeOpacity}
      focusable={!disabled}
      hasTVPreferredFocus={hasTVPreferredFocus}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onPress={onPress}
      disabled={disabled}
      style={[
        style,
        isFocused && styles.focused,
        isFocused && scaleOnFocus && styles.focusedScale,
        isFocused && focusedStyle,
      ]}>
      {children}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  focused: {
    borderColor: '#FFFFFF',
    borderWidth: 2,
    borderRadius: 6,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  focusedScale: {
    transform: [{ scale: 1.05 }],
  },
});
