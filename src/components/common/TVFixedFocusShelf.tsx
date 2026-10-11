import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  StyleProp,
  ViewStyle,
  DeviceEventEmitter,
} from 'react-native';
import { TVFocusable } from './TVFocusable';
import { tvNavigation } from '../../services/tvNavigation';

export interface TVFixedFocusShelfProps<T> {
  data: T[];
  itemWidth: number;
  cardWidth: number;
  cardHeight: number;
  borderRadius?: number;
  anchorLeft?: number;
  anchorTop?: number;
  paddingLeft?: number;
  paddingTop?: number;
  paddingBottom?: number;
  scaleOnFocus?: boolean;
  railId: string;
  isFirstRail?: boolean;
  onSelect: (item: T, index: number) => void;
  onFocus?: () => void;
  onPressUp?: () => void;
  onPressDown?: () => void;
  onPressLeftAtStart?: () => void;
  renderItem: (item: T, index: number, isActive: boolean, isRailFocused: boolean) => React.ReactNode;
  focusRingStyle?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
}

export function TVFixedFocusShelf<T>({
  data,
  itemWidth,
  cardWidth,
  cardHeight,
  borderRadius = 8,
  anchorLeft = 16,
  anchorTop = 12,
  paddingLeft,
  paddingTop,
  paddingBottom,
  scaleOnFocus = false,
  railId,
  isFirstRail = false,
  onSelect,
  onFocus,
  onPressUp,
  onPressDown,
  onPressLeftAtStart,
  renderItem,
  focusRingStyle,
  containerStyle,
}: TVFixedFocusShelfProps<T>) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [nodeHandle, setNodeHandle] = useState<number | undefined>(undefined);
  const activeIndexRef = useRef(0);
  const isFocusedRef = useRef(false);
  const lastPressTimeRef = useRef(0);
  const lastSelectTimeRef = useRef(0);
  const KEY_THROTTLE_MS = 160;
  const SELECT_THROTTLE_MS = 250;
  const scrollX = useRef(new Animated.Value(0)).current;
  const anchorRef = useRef<any>(null);

  useEffect(() => {
    if (anchorRef.current?.getNodeHandle) {
      const handle = anchorRef.current.getNodeHandle();
      if (handle) {
        setNodeHandle(handle);
      }
    }
  }, []);

  useEffect(() => {
    if (isFirstRail && anchorRef.current) {
      tvNavigation.registerFirstRailFirstItem(anchorRef.current);
    }
  }, [isFirstRail]);

  useEffect(() => {
    if (activeIndexRef.current >= data.length && data.length > 0) {
      activeIndexRef.current = 0;
      setActiveIndex(0);
      scrollX.setValue(0);
    }
  }, [data.length, scrollX]);

  const handlePressRight = useCallback(() => {
    const now = Date.now();
    if (now - lastPressTimeRef.current < KEY_THROTTLE_MS) {
      return;
    }
    lastPressTimeRef.current = now;

    const prev = activeIndexRef.current;
    if (prev < data.length - 1) {
      const next = prev + 1;
      activeIndexRef.current = next;
      setActiveIndex(next);
      Animated.timing(scrollX, {
        toValue: -next * itemWidth,
        duration: 180,
        useNativeDriver: true,
      }).start();
      tvNavigation.setFocusedContent(railId, next, anchorRef.current);
    }
  }, [data.length, itemWidth, railId, scrollX]);

  const handlePressLeft = useCallback(() => {
    const now = Date.now();
    if (now - lastPressTimeRef.current < KEY_THROTTLE_MS) {
      return;
    }
    lastPressTimeRef.current = now;

    const prev = activeIndexRef.current;
    if (prev > 0) {
      const next = prev - 1;
      activeIndexRef.current = next;
      setActiveIndex(next);
      Animated.timing(scrollX, {
        toValue: -next * itemWidth,
        duration: 180,
        useNativeDriver: true,
      }).start();
      tvNavigation.setFocusedContent(railId, next, anchorRef.current);
      return;
    }
    // When at index 0 and pressing left, focus sidebar
    if (onPressLeftAtStart) {
      onPressLeftAtStart();
    } else {
      tvNavigation.focusSidebar('home');
    }
  }, [itemWidth, railId, scrollX, onPressLeftAtStart]);

  const handlePress = useCallback(() => {
    const now = Date.now();
    if (now - lastSelectTimeRef.current < SELECT_THROTTLE_MS) {
      return;
    }
    lastSelectTimeRef.current = now;

    const current = activeIndexRef.current;
    const item = data[current];
    if (item) {
      onSelect(item, current);
    }
  }, [data, onSelect]);

  const handleFocus = useCallback(() => {
    isFocusedRef.current = true;
    setIsFocused(true);
    lastPressTimeRef.current = Date.now();
    if (!nodeHandle && anchorRef.current?.getNodeHandle) {
      const handle = anchorRef.current.getNodeHandle();
      if (handle) {
        setNodeHandle(handle);
      }
    }
    if (onFocus) onFocus();
    if (anchorRef.current) {
      tvNavigation.setLastFocusedContent(anchorRef.current);
      tvNavigation.setFocusedContent(railId, activeIndexRef.current, anchorRef.current);
    }
  }, [onFocus, railId, nodeHandle]);

  const handleBlur = useCallback(() => {
    isFocusedRef.current = false;
    setIsFocused(false);
  }, []);

  // Handle hardware D-pad key events emitted from Android Activity
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(
      'onHWKeyEvent',
      (e: { eventType: string; keyCode?: number }) => {
        if (!isFocusedRef.current) return;
        if (tvNavigation.getIsModalOpen()) return;

        if (e.eventType === 'right') {
          handlePressRight();
        } else if (e.eventType === 'left') {
          handlePressLeft();
        } else if (e.eventType === 'select') {
          handlePress();
        }
      }
    );

    return () => {
      sub.remove();
    };
  }, [handlePressRight, handlePressLeft, handlePress, railId]);

  if (!data || !data.length) return null;

  return (
    <View style={[styles.root, containerStyle]}>
      {/* Sliding track containing the horizontal row of items */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.track,
          {
            paddingLeft: paddingLeft ?? anchorLeft,
            paddingTop: paddingTop ?? anchorTop,
            paddingBottom: paddingBottom ?? 16,
            transform: [{ translateX: scrollX }],
          },
        ]}>
        {data.map((item, idx) => (
          <React.Fragment key={idx}>
            {renderItem(item, idx, idx === activeIndex, isFocused)}
          </React.Fragment>
        ))}
      </Animated.View>

      {/* Anchor Focusable sitting at the stationary Slot 0 coordinate */}
      <TVFocusable
        ref={anchorRef}
        scaleOnFocus={scaleOnFocus}
        style={[
          styles.anchor,
          {
            left: anchorLeft,
            top: anchorTop,
            width: cardWidth,
            height: cardHeight,
            borderRadius,
          },
        ]}
        borderRadius={borderRadius}
        focusRingStyle={focusRingStyle}
        nextFocusRight={nodeHandle}
        nextFocusLeft={activeIndex > 0 ? nodeHandle : undefined}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onPress={handlePress}
        onPressUp={onPressUp}
        onPressDown={onPressDown}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'relative',
    overflow: 'hidden',
  },
  track: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  anchor: {
    position: 'absolute',
    backgroundColor: 'transparent',
    zIndex: 10,
  },
});
