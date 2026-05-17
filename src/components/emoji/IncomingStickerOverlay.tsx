// Full-screen overlay shown on the RECEIVER's phone when a sticker arrives.
// Layers: dark backdrop + sender header + size badge + falling stickers.
// Auto-dismisses after TOTAL_DISPLAY_TIME ms then calls onComplete().

import React, { useEffect, useState } from 'react';
import {Dimensions,StyleSheet,Text,View,} from 'react-native';
import Animated, {useSharedValue,useAnimatedStyle,withTiming,
  withSpring,runOnJS,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import FallingSticker from '@/components/emoji/FallingSticker';
import STICKERS from '@/data/stickers';
import { EmojiReaction } from '@/types/emojiReaction';

// ── Constants ──
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const STICKER_COUNT       = 12;    // how many stickers fall at once
const TOTAL_DISPLAY_TIME  = 3500;  // ms before overlay starts to dismiss

// ── Types ───
export type SenderInfo = {
  username: string;
  full_name?: string | null;
  avatar_url?: string | null;
};

// Config for one falling sticker — generated randomly on mount
type FallerConfig = {
  id: number;
  source: number;
  startX: number;
  delay: number;
  duration: number;
  initialRotation: number;
};

type Props = {
  reaction: EmojiReaction;    // the incoming reaction from Supabase
  senderInfo: SenderInfo;     // sender's profile (looked up by map screen)
  onComplete: () => void;     
};

// ── Component ───
export default function IncomingStickerOverlay({
  reaction,
  senderInfo,
  onComplete,
}: Props) {
  // Find the matching sticker from our local list using sticker_id
  // Falls back to first sticker if not found (safety net)
  const sticker =
    STICKERS.find((s) => s.id === reaction.sticker_id) ?? STICKERS[0];

  // ── Generate faller configs once on mount ───
  // useState with an initializer function runs ONCE — not on every render.
  // This gives each sticker a unique random position/speed/rotation.
  const [fallers] = useState<FallerConfig[]>(() =>
    Array.from({ length: STICKER_COUNT }, (_, i) => ({
      id: i,
      source: sticker.source,
      // spread across full screen width, minus sticker size so it doesn't clip edge
      startX: Math.random() * (SCREEN_WIDTH - 56),
      // stagger start times: 0ms to 800ms apart
      delay: Math.random() * 800,
      // each sticker falls at a different speed: 1.3s to 2.2s
      duration: 1300 + Math.random() * 900,
      // random tilt: -35° to +35°
      initialRotation: Math.random() * 70 - 35,
    }))
  );

  // ── Shared animation values ─
  const backdropOpacity   = useSharedValue(0);
  const headerTranslateY  = useSharedValue(-100); // starts above screen
  const badgeScale        = useSharedValue(0);
  const badgeOpacity      = useSharedValue(0);
  const everythingOpacity = useSharedValue(1); // used for final fade-out

  const handleComplete = () => onComplete();

  // ── Run all animations on mount ──
  useEffect(() => {
    // 1. Backdrop fades in
    backdropOpacity.value = withTiming(0.78, { duration: 350 });

    // 2. Header slides down with a spring so it feels alive
    headerTranslateY.value = withSpring(0, {
      damping: 14,
      stiffness: 140,
    });

    // 3. Badge pops in from scale 0 → 1 (overshoot = bouncy)
    badgeScale.value   = withSpring(1, { damping: 8, stiffness: 180 });
    badgeOpacity.value = withTiming(1, { duration: 350 });

    // 4. Auto-dismiss after TOTAL_DISPLAY_TIME
    const dismissTimer = setTimeout(() => {
      // Fade out everything together
      everythingOpacity.value = withTiming(
        0,
        { duration: 500 },
        (finished) => {
          if (finished) runOnJS(handleComplete)();
        }
      );
    }, TOTAL_DISPLAY_TIME);

    // Cleanup: if parent unmounts early, cancel the timer
    return () => clearTimeout(dismissTimer);
  }, []);

  // ── Animated styles ───
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const headerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const badgeStyle = useAnimatedStyle(() => ({
    opacity: badgeOpacity.value,
    transform: [{ scale: badgeScale.value }],
  }));

  // Wrapper style — fades out everything at once on dismiss
  const wrapperStyle = useAnimatedStyle(() => ({
    opacity: everythingOpacity.value,
  }));

  // ── Derived display values ──
  const displayName = senderInfo.full_name ?? senderInfo.username;

  // Badge text:
  // size_multiplier > 1 → show "2.5×" (they held the sticker)
  // size_multiplier = 1 → show the sticker label 
  const badgeText =
    reaction.size_multiplier > 1
      ? `${reaction.size_multiplier.toFixed(1)}×`
      : sticker.label;

  // ── Render ───
  return (
    // Animated.View wrapper lets us fade out EVERYTHING in one go
    <Animated.View
      style={[StyleSheet.absoluteFill, wrapperStyle]}
      pointerEvents="none" // never block map touches
    >
      {/* ── Dark backdrop ───────────────────────────────────── */}
      <Animated.View style={[styles.backdrop, backdropStyle]} />

      {/* ── Falling stickers ────────────────────────────────── */}
      {/* Rendered before header/badge so they appear BEHIND the UI */}
      {fallers.map((f) => (
        <FallingSticker
          key={f.id}
          source={f.source}
          startX={f.startX}
          delay={f.delay}
          duration={f.duration}
          initialRotation={f.initialRotation}
        />
      ))}

      {/* ── Sender header ───────────────────────────────────── */}
      {/* Slides down from top — shows who sent the sticker      */}
      <Animated.View style={[styles.header, headerStyle]}>
        {/* Avatar */}
        {senderInfo.avatar_url ? (
          <Image
            source={{ uri: senderInfo.avatar_url }}
            style={styles.avatar}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarInitial}>
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        {/* Name + subtitle */}
        <View style={styles.senderTextBlock}>
          <Text style={styles.senderName} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={styles.senderSub}>
            sent you a sticker!
          </Text>
        </View>

        {/* Sticker preview in the header */}
        <Image
          source={sticker.source}
          style={styles.headerSticker}
          contentFit="contain"
        />
      </Animated.View>

      {/* ── Center size badge ───────────────────────────────── */}
      {/* Pops in with a spring — shows the size or sticker name */}
      <Animated.View style={[styles.badgeContainer, badgeStyle]}>
        <Text style={styles.badgeText}>{badgeText}</Text>
      </Animated.View>
    </Animated.View>
  );
}

// ── Styles ────
const styles = StyleSheet.create({
  // Solid dark layer behind everything
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },

  // Frosted glass card at the top
  header: {
    position: 'absolute',
    top: 56,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    // subtle border so the card is visible on any map background
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },

  avatarFallback: {
    backgroundColor: '#a78bfa',
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarInitial: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 18,
  },

  senderTextBlock: {
    flex: 1,
  },

  senderName: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },

  senderSub: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
    marginTop: 2,
  },

  // Sticker thumbnail in the header (right side)
  headerSticker: {
    width: 40,
    height: 40,
    marginLeft: 8,
  },

  // Center of screen — the big bold badge
  badgeContainer: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.38,
    alignSelf: 'center',
  },

  badgeText: {
    color: '#fff',
    fontSize: 72,
    fontWeight: '900',
    letterSpacing: -2,
    // Drop shadow so it pops on any background
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 10,
  },
});