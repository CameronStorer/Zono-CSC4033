// Renders one sticker with tap and press-and-hold behavior.
// - Quick tap    → sends at sizeMultiplier 1.0
// - Hold         → sticker grows toward MAX_SCALE over GROW_DURATION ms
// - Release      → sends at current scale, resets to normal
// - Reaches max  → auto-sends, resets (even if still holding)

import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, {useSharedValue,useAnimatedStyle,withTiming,cancelAnimation,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { Image, ImageSource } from 'expo-image';
import { StickerItem } from '@/data/stickers';

const STICKER_SIZE = 110;     
const MAX_SCALE    = 3.0;   
const GROW_DURATION = 2000;  

type Props = {
  sticker: StickerItem;
  isScrolling: React.RefObject<boolean>
  onSend: (sticker: StickerItem, sizeMultiplier: number) => void;
};

export default function StickerButton({ sticker, onSend, isScrolling }: Props) {
  const scale = useSharedValue(1);

  // true = already auto-sent at max, so onPressOut should do nothing.
  const autoSentFlag = useSharedValue(false);

  // Animated style — Reanimated watches scale and updates transform
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Wrap onSend in useCallback so it's stable across renders
  const handleSend = useCallback(
    (sizeMultiplier: number) => {
      const rounded = Math.round(sizeMultiplier * 100) / 100;
      onSend(sticker, rounded);
    },
    [sticker, onSend]
  );

  // Press In: start growing 
  const onPressIn = useCallback(() => {
    if (isScrolling.current) return;
    autoSentFlag.value = false; // reset flag for this press

    scale.value = withTiming(
      MAX_SCALE,
      {
        duration: GROW_DURATION,
        easing: Easing.out(Easing.quad), // starts fast, slows near max
      },
      (finished) => {
        // This callback runs on the UI thread when animation completes.
        // finished = true  → reached MAX_SCALE naturally (user held long enough)
        // finished = false → cancelAnimation() was called (user released early)
        if (finished) {
          autoSentFlag.value = true;        
          runOnJS(handleSend)(MAX_SCALE);     
          // Reset back to normal size smoothly
          scale.value = withTiming(1, { duration: 300 });
        }
      }
    );
  }, [scale, autoSentFlag, handleSend, isScrolling]);

  // Press Out: send at current size, reset
  const onPressOut = useCallback(() => {
    // User was scrolling — cancel everything, don't send
    if (isScrolling.current) {
        cancelAnimation(scale);
        scale.value = withTiming(1, { duration: 200 });
        return; // ← EXIT early, no send
    }
    // If auto-sent already fired (held to max), do nothing
    if (autoSentFlag.value) return;

    const currentScale = scale.value;
    // Stop the grow animation wherever it is right now
    cancelAnimation(scale);

    // Send at whatever size the sticker reached
    runOnJS(handleSend)(Math.max(1, currentScale));
    scale.value = withTiming(1, { duration: 200 });
  }, [scale, autoSentFlag, handleSend, isScrolling]);

  // Render 
  return (
    <Pressable
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={styles.pressable}
    >
      <Animated.View style={[styles.imageWrapper, animatedStyle]}>
        <Image
          source={sticker.source as ImageSource}
          style={styles.image}
          contentFit="contain"
        />
      </Animated.View>


      <Text style={styles.label} numberOfLines={1}>
        {sticker.label}
      </Text>
    </Pressable>
  );
}

// ── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  pressable: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 4,
    width: STICKER_SIZE + 16,
  },
  imageWrapper: {
    width: STICKER_SIZE,
    height: STICKER_SIZE,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  label: {
    marginTop: 5,
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
});