// One sticker that falls from top to bottom on the receiver screen.
// Simplified: uses direct translateY instead of progress + interpolate.
// This avoids the compound failure where one stuck value breaks everything.

import React, { useEffect } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Image } from 'expo-image';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const STICKER_SIZE = 56;

type Props = {
  source: number;
  startX: number;
  delay: number;
  duration: number;
  initialRotation: number;
  onComplete?: () => void;
};

export default function FallingSticker({
    source,
    startX,
    delay,
    duration,
    initialRotation,
    onComplete,
    }: Props) {
    // ── Direct shared values — 
    // translateY: starts above screen (-STICKER_SIZE), falls to bottom
    const translateY = useSharedValue(-STICKER_SIZE);
    const opacity    = useSharedValue(0);
    const rotate     = useSharedValue(initialRotation);

    useEffect(() => {
        // 1. Fall from above screen to below screen
        translateY.value = withDelay(
        delay,
        withTiming(SCREEN_HEIGHT, {
            duration,
            easing: Easing.in(Easing.quad), // accelerates like gravity
        })
        );

        // 2. Spin during the fall
        rotate.value = withDelay(
        delay,
        withTiming(initialRotation + 360, { duration })
        );

        // 3. Opacity — ONE withSequence so steps never cancel each other:
        //    fade in (200ms) → stay visible → fade out (last 40%)
        const holdDuration = Math.max(0, duration * 0.6 - 200);

        opacity.value = withDelay(
        delay,
        withSequence(
            withTiming(1, { duration: 200 }),           // fade IN
            withTiming(1, { duration: holdDuration }),  // stay visible
            withTiming(                                 // fade OUT
            0,
            { duration: duration * 0.4 },
            (finished) => {
                if (finished && onComplete) runOnJS(onComplete)();
            }
            )
        )
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [
        { translateY: translateY.value },
        { rotate: `${rotate.value}deg` },
        ],
    }));

    return (
        <Animated.View
        style={[
            styles.sticker,
            { left: startX }, 
            animatedStyle,
        ]}
        pointerEvents="none"
        >
        <Image
            source={source}
            style={styles.image}
            contentFit="contain"
        />
        </Animated.View>
    );
    }

    const styles = StyleSheet.create({
    sticker: {
        position: 'absolute',
        top: 0,           // explicit top: 0 so React Native knows start position
        width: STICKER_SIZE,
        height: STICKER_SIZE,
    },
    image: {
        width: '100%',
        height: '100%',
    },
});