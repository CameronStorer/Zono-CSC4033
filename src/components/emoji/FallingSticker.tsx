// One sticker that falls from top to bottom of the screen.
// Used by IncomingStickerOverlay — spawns many of these at once.
// Each instance is independent with its own animation state.

import React, { useEffect } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import Animated, {useSharedValue,useAnimatedStyle,withTiming,withDelay,
  withSequence,interpolate,Easing,runOnJS,
} from 'react-native-reanimated';
import { Image } from 'expo-image';

// ── Constants ───
const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const STICKER_SIZE = 56; 

// ── Types ───
type Props = {
  source: number;        // the PNG require() result
  startX: number;        // random X position (set by parent)
  delay: number;         // ms to wait before starting fall
  duration: number;      // ms the full fall takes (random speed)
  initialRotation: number; // starting tilt in degrees (random)
  onComplete?: () => void; 
};

// ── Component ──
export default function FallingSticker({
  source,startX,delay,duration,initialRotation,
  onComplete,
}: Props) {
  // ── Shared values ──
  // progress: 0 = top of screen, 1 = bottom of screen
  // We drive ALL animations from this one value using interpolate.
  // This keeps everything perfectly in sync.
  const progress = useSharedValue(0);
  const opacity  = useSharedValue(0);

  // ── Start animations on mount ───
  useEffect(() => {
    // Fade in quickly first
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: 200 })
    );

    // Drive the fall using progress 0 → 1
    // withDelay waits [delay]ms before starting
    progress.value = withDelay(
      delay,
      withTiming(1, {
        duration,
        easing: Easing.in(Easing.quad), 
      })
    );

    // Fade out near the end of the fall
    opacity.value = withDelay(
      delay + duration * 0.7,
      withTiming(0, {
        duration: duration * 0.3, // fade over the last 30% of fall
      }, (finished) => {
        if (finished && onComplete) {
          runOnJS(onComplete)();
        }
      })
    );
  }, []);

  // ── Animated style ───
  const animatedStyle = useAnimatedStyle(() => {
    // translateY: maps progress 0→1 to -STICKER_SIZE → SCREEN_HEIGHT
    // So it starts just above screen and falls to below screen
    const translateY = interpolate(
      progress.value,
      [0, 1],
      [-STICKER_SIZE, SCREEN_HEIGHT]
    );

    // rotate: spins from initialRotation to initialRotation + 360°
    // So it does one full spin during the fall
    const rotateDeg = interpolate(
      progress.value,
      [0, 1],
      [initialRotation, initialRotation + 360]
    );

    // Slight horizontal sway — makes it look like it's drifting
    // in the wind rather than falling perfectly straight
    const swayX = interpolate(
      progress.value,
      [0, 0.25, 0.5, 0.75, 1],
      [0, 8, -6, 10, -4]
    );

    return {
      opacity: opacity.value,
      transform: [
        { translateX: swayX },
        { translateY },
        { rotate: `${rotateDeg}deg` },
      ],
    };
  });

  // ── Render ───
  return (
    <Animated.View
      style={[
        styles.sticker,
        { left: startX },  // horizontal position set by parent
        animatedStyle,
      ]}
      pointerEvents="none" // never block touches — this is purely visual
    >
      <Image
        source={source}
        style={styles.image}
        contentFit="contain"
      />
    </Animated.View>
  );
}

// ── Styles ──
const styles = StyleSheet.create({
  sticker: {
    position: 'absolute',
    width: STICKER_SIZE,
    height: STICKER_SIZE,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});