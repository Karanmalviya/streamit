import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Pressable,
  StyleSheet,
  StyleProp,
  ViewStyle,
  Animated,
  findNodeHandle,
  DeviceEventEmitter,
} from 'react-native';

import { tvNavigation } from '../../services/tvNavigation';

export interface TVFocusableProps {
  children?: React.ReactNode | ((props: { focused: boolean }) => React.ReactNode);
  onPress?: (event?: any) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onLayout?: (event?: any) => void;
  style?: StyleProp<ViewStyle>;
  focusedStyle?: StyleProp<ViewStyle>;
  focusRingStyle?: StyleProp<ViewStyle>;
  hasTVPreferredFocus?: boolean;
  activeOpacity?: number;
  scaleOnFocus?: boolean;
  disabled?: boolean;
  borderRadius?: number;
  nativeID?: string;
  nextFocusDown?: number;
  nextFocusUp?: number;
  nextFocusLeft?: number;
  nextFocusRight?: number;
  accessibilityLabel?: string;
  onPressLeft?: () => void;
  onPressRight?: () => void;
  onPressUp?: () => void;
  onPressDown?: () => void;
  onKeyDown?: (event: any) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable) as any;

// Global hardware key lock across ALL TVFocusable elements
// Guarantees only one component can consume a hardware event and prevents listener cascade
let globalHWKeyLockUntil = 0;
const HW_KEY_THROTTLE_MS = 180;

export const TVFocusable = React.forwardRef<any, TVFocusableProps>(function TVFocusableComponent(
  {
    children,
    onPress,
    onFocus,
    onBlur,
    onLayout,
    style,
    focusedStyle,
    focusRingStyle,
    hasTVPreferredFocus = false,
    activeOpacity = 0.85,
    scaleOnFocus = true,
    disabled = false,
    borderRadius = 8,
    nativeID,
    nextFocusDown,
    nextFocusUp,
    nextFocusLeft,
    nextFocusRight,
    accessibilityLabel,
    onPressLeft,
    onPressRight,
    onPressUp,
    onPressDown,
    onKeyDown: propsOnKeyDown,
  },
  ref
) {
  const [isFocused, setIsFocused] = useState(false);
  // isFocusedRef is the ONLY gatekeeper for HWKeyEvent handling.
  // It must be updated synchronously before any async React state.
  const isFocusedRef = useRef(false);
  const innerRef = useRef<any>(null);
  const refHandleRef = useRef<any>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Trigger hasTVPreferredFocus on native view after mount
  useEffect(() => {
    if (hasTVPreferredFocus) {
      const timer = setTimeout(() => {
        innerRef.current?.focus?.();
      }, 60);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: isFocused ? (scaleOnFocus ? 1.05 : 1) : 1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: isFocused ? 1 : 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isFocused, scaleOnFocus, scaleAnim, opacityAnim]);

  const handleFocus = useCallback(() => {
    // Update ref synchronously FIRST
    isFocusedRef.current = true;
    setIsFocused(true);
    if (refHandleRef.current) {
      tvNavigation.setActiveFocus(refHandleRef.current);
    }
    if (onFocus) onFocus();
  }, [onFocus]);

  const handleBlur = useCallback(() => {
    // Update ref synchronously FIRST
    isFocusedRef.current = false;
    setIsFocused(false);
    if (onBlur) onBlur();
  }, [onBlur]);

  // onPressXxx refs to avoid stale closures in HWKeyEvent listener
  const onPressLeftRef = useRef(onPressLeft);
  const onPressRightRef = useRef(onPressRight);
  const onPressUpRef = useRef(onPressUp);
  const onPressDownRef = useRef(onPressDown);
  const onPressRef = useRef(onPress);
  useEffect(() => { onPressLeftRef.current = onPressLeft; }, [onPressLeft]);
  useEffect(() => { onPressRightRef.current = onPressRight; }, [onPressRight]);
  useEffect(() => { onPressUpRef.current = onPressUp; }, [onPressUp]);
  useEffect(() => { onPressDownRef.current = onPressDown; }, [onPressDown]);
  useEffect(() => { onPressRef.current = onPress; }, [onPress]);

  // Hardware D-pad event listener — registered once, uses refs for current handlers
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(
      'onHWKeyEvent',
      (e: { eventType: string; keyCode?: number; eventKeyAction?: number }) => {
        // Gate 1: only handle events when THIS element is natively focused
        if (!isFocusedRef.current) return;

        // Gate 2: Ignore key release events (ACTION_UP)
        if (e.eventKeyAction === 1) return;

        // Gate 3: Global cooldown across all TVFocusable instances
        const now = Date.now();
        if (now < globalHWKeyLockUntil) return;

        const { eventType, keyCode } = e;
        const isLeft = eventType === 'left' || keyCode === 21;
        const isRight = eventType === 'right' || keyCode === 22;
        const isUp = eventType === 'up' || keyCode === 19;
        const isDown = eventType === 'down' || keyCode === 20;
        const isSelect =
          eventType === 'select' ||
          eventType === 'center' ||
          keyCode === 23 ||
          keyCode === 66;

        if (isLeft && onPressLeftRef.current) {
          globalHWKeyLockUntil = now + HW_KEY_THROTTLE_MS;
          onPressLeftRef.current();
        } else if (isRight && onPressRightRef.current) {
          globalHWKeyLockUntil = now + HW_KEY_THROTTLE_MS;
          onPressRightRef.current();
        } else if (isUp && onPressUpRef.current) {
          globalHWKeyLockUntil = now + HW_KEY_THROTTLE_MS;
          onPressUpRef.current();
        } else if (isDown && onPressDownRef.current) {
          globalHWKeyLockUntil = now + HW_KEY_THROTTLE_MS;
          onPressDownRef.current();
        } else if (isSelect && onPressRef.current) {
          globalHWKeyLockUntil = now + HW_KEY_THROTTLE_MS;
          onPressRef.current();
        }
      }
    );
    return () => sub.remove();
  // Intentionally empty: listener uses refs, so no deps needed
  }, []);

  const handleKeyDown = useCallback(
    (e: any) => {
      const key = e.nativeEvent?.key || e.nativeEvent?.code || '';
      const keyCode = e.nativeEvent?.keyCode;

      const isLeft = key === 'ArrowLeft' || key === 'left' || key === 'dpadLeft' || keyCode === 21;
      const isRight = key === 'ArrowRight' || key === 'right' || key === 'dpadRight' || keyCode === 22;
      const isUp = key === 'ArrowUp' || key === 'up' || key === 'dpadUp' || keyCode === 19;
      const isDown = key === 'ArrowDown' || key === 'down' || key === 'dpadDown' || keyCode === 20;
      const isSelect = key === 'Enter' || key === 'select' || keyCode === 23 || keyCode === 66;

      if (!isLeft && !isRight && !isUp && !isDown && !isSelect) {
        if (propsOnKeyDown) propsOnKeyDown(e);
        return;
      }

      const now = Date.now();
      if (now < globalHWKeyLockUntil) {
        if (propsOnKeyDown) propsOnKeyDown(e);
        return;
      }

      if (isLeft && onPressLeft) {
        globalHWKeyLockUntil = now + HW_KEY_THROTTLE_MS;
        onPressLeft();
      } else if (isRight && onPressRight) {
        globalHWKeyLockUntil = now + HW_KEY_THROTTLE_MS;
        onPressRight();
      } else if (isUp && onPressUp) {
        globalHWKeyLockUntil = now + HW_KEY_THROTTLE_MS;
        onPressUp();
      } else if (isDown && onPressDown) {
        globalHWKeyLockUntil = now + HW_KEY_THROTTLE_MS;
        onPressDown();
      } else if (isSelect && onPress) {
        globalHWKeyLockUntil = now + HW_KEY_THROTTLE_MS;
        onPress();
      }
      if (propsOnKeyDown) propsOnKeyDown(e);
    },
    [onPress, onPressLeft, onPressRight, onPressUp, onPressDown, propsOnKeyDown]
  );

  const [isPressed, setIsPressed] = useState(false);

  // Expose focus/blur/getNodeHandle via ref for external callers
  React.useImperativeHandle(ref, () => {
    const handle = {
      focus: () => {
        globalHWKeyLockUntil = Math.max(globalHWKeyLockUntil, Date.now() + HW_KEY_THROTTLE_MS);
        isFocusedRef.current = true;
        setIsFocused(true);
        tvNavigation.setActiveFocus(handle);
        if (onFocus) onFocus();
        innerRef.current?.focus?.();
      },
      blur: () => {
        isFocusedRef.current = false;
        setIsFocused(false);
        if (onBlur) onBlur();
      },
      getNodeHandle: () => {
        try {
          const h = findNodeHandle(innerRef.current);
          return typeof h === 'number' && h > 0 ? h : null;
        } catch {
          return null;
        }
      },
    };
    refHandleRef.current = handle;
    return handle;
  }, [onFocus, onBlur]);

  return (
    <AnimatedPressable
      ref={innerRef}
      focusable={!disabled}
      hasTVPreferredFocus={false}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onPress={onPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      onKeyDown={handleKeyDown}
      onLayout={onLayout}
      disabled={disabled}
      nativeID={nativeID}
      nextFocusDown={nextFocusDown}
      nextFocusUp={nextFocusUp}
      nextFocusLeft={nextFocusLeft}
      nextFocusRight={nextFocusRight}
      accessibilityLabel={accessibilityLabel}
      style={[
        style,
        isPressed && { opacity: activeOpacity },
        isFocused && focusedStyle,
        { transform: [{ scale: scaleAnim }] },
      ]}>
      {typeof children === 'function' ? children({ focused: isFocused }) : children}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          styles.focusRingOverlay,
          borderRadius !== undefined && { borderRadius },
          focusRingStyle,
          { opacity: opacityAnim },
        ]}
      />
    </AnimatedPressable>
  );
});

const styles = StyleSheet.create({
  focusRingOverlay: {
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    borderRadius: 8,
  },
});
