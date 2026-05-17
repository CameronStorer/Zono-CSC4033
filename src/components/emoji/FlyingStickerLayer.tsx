// Renders a single sticker that flies from the sticker picker (bottom)
// toward the selected friend's marker position on the map.
// Mounted by map/index.tsx after a sticker is sent.
// Calls onComplete() when the animation finishes so the parent can unmount it.

import React, { useEffect } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import Animated, {useSharedValue,useAnimatedStyle,withTiming,withSequence,withDelay,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { StickerItem } from '@/data/stickers';

// ── Constants ───
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const STICKER_SIZE    = 64;   
const FLY_DURATION    = 650;  
const FADE_DELAY      = 400;  
const FADE_DURATION   = 250;  

// Where the sticker starts — the middle of where the picker sheet sits
const START_X = SCREEN_WIDTH  / 2 - STICKER_SIZE / 2;
const START_Y = SCREEN_HEIGHT * 0.72 - STICKER_SIZE / 2;

// ── Types ───
type Props = {
  sticker: StickerItem;
  sizeMultiplier: number; // initial scale (from how long user held)
  targetX: number;        // screen pixel X of friend's marker
  targetY: number;        // screen pixel Y of friend's marker
  onComplete: () => void; 
};

// ── Component ───
export default function FlyingStickerLayer({
  sticker,
  sizeMultiplier,
  targetX,
  targetY,
  onComplete,
}: Props) {
  // ── Shared values (live on UI thread) ───
  // x, y: current position of the sticker's top-left corner
  const x       = useSharedValue(START_X);
  const y       = useSharedValue(START_Y);
  const scale   = useSharedValue(sizeMultiplier); // start at held size
  const opacity = useSharedValue(1);

  // ── Start animation on mount ────
  useEffect(() => {
    // Convert targetX/Y to top-left corner position
    // (target is where the center of the marker is, we adjust by half sticker size)
    const destX = targetX - STICKER_SIZE / 2;
    const destY = targetY - STICKER_SIZE / 2;

    // ── Fly toward the marker ──────
    x.value = withTiming(destX, {
      duration: FLY_DURATION,
      easing: Easing.out(Easing.cubic),
    });

    y.value = withTiming(destY, {
      duration: FLY_DURATION,
      easing: Easing.out(Easing.cubic),
    });

    // ── Scale: grow slightly first (throw effect), then shrink ──
    // 1. Quickly grow a little (like it was "thrown" with force)
    // 2. Shrink down as it arrives at the marker
    scale.value = withSequence(
      withTiming(sizeMultiplier * 1.2, { duration: 150 }),  // quick grow
      withTiming(0.4, { duration: FLY_DURATION - 150 }),    // shrink to small
    );

    // ── Fade out near the end of the flight ────
    // withDelay waits before starting the fade
    // The opacity callback fires on the UI thread when done
    // runOnJS lets us call onComplete() (a JS function) from the UI thread
    opacity.value = withDelay(
      FADE_DELAY,
      withTiming(0, { duration: FADE_DURATION }, (finished) => {
        if (finished) {
          runOnJS(onComplete)();
        }
      })
    );
  }, []); 

  // ── Animated style ─────
  const animatedStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: x.value,
    top: y.value,
    width: STICKER_SIZE,
    height: STICKER_SIZE,
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  // ── Render ────
  return (
    <Animated.View style={animatedStyle} pointerEvents="none">
      <Image
        source={sticker.source}
        style={styles.image}
        contentFit="contain"
      />
    </Animated.View>
  );
}

// ── Styles ──
const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%',
  },
});