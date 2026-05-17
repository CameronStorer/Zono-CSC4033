// A slide-up bottom sheet that shows the sticker picker.
// Opened when the user taps a friend marker on the map.
// Contains a horizontal FlatList of StickerButton components.

import React, { useEffect, useRef } from 'react';
import {View,Text,FlatList,StyleSheet,
  TouchableWithoutFeedback,Dimensions,Modal} from 'react-native';
import Animated, {useSharedValue,useAnimatedStyle,
  withSpring,withTiming,} from 'react-native-reanimated';
import { Image } from 'expo-image';
import StickerButton from '@/components/emoji/StickerButton';
import STICKERS, { StickerItem } from '@/data/stickers';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

const SHEET_HEIGHT = 350;
const CLOSE_THRESHOLD  = 80;

export type SheetFriend = {
  id: number;
  username: string;
  full_name?: string | null;
  avatar_url?: string | null;
};

type Props = {
  visible: boolean;           // true = slide up, false = slide down
  friend: SheetFriend | null; // the friend we're sending to
  onSend: (sticker: StickerItem, sizeMultiplier: number) => void;
  onClose: () => void;        // called when backdrop is tapped
};

// Component 
export default function EmojiPickerSheet({visible,friend,onSend,onClose,
}: Props) {
    // translateY: SHEET_HEIGHT = hidden below screen, 0 = fully visible
    const translateY    = useSharedValue(SHEET_HEIGHT);
    const backdropAlpha = useSharedValue(0);
    const isScrolling = useRef(false);

    // Animate whenever visible changes
    useEffect(() => {
    if (visible) {
        // Slide UP with a spring so it feels bouncy and natural
        translateY.value    = withSpring(0, { stiffness: 300 });
        backdropAlpha.value = withTiming(1, { duration: 50 });
    } else {
        // Slide DOWN smoothly
        translateY.value    = withTiming(SHEET_HEIGHT, { duration: 220 });
        backdropAlpha.value = withTiming(0, { duration: 200 });
    }
    }, [visible]);

    // Animated styles
    const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    }));

    const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropAlpha.value,
    }));

    // Don't intercept touches when fully hidden
    const pointerEvents = visible ? 'auto' : 'none';

    // ── Swipe down to close gesture ──────────────────────────────
    // Tracks finger movement on the handle bar.
    // If dragged down more than CLOSE_THRESHOLD px → close.
    // If released too early → snap back open.
    const panGesture = Gesture.Pan()
    .onUpdate((event) => {
        // Only allow dragging DOWN (positive = downward)
        // Prevent dragging the sheet upward past its open position
        if (event.translationY > 0) {
        translateY.value = event.translationY;
        }
    })
    .onEnd((event) => {
        if (event.translationY > CLOSE_THRESHOLD) {
        // Dragged far enough → animate closed then call onClose
        translateY.value = withTiming(SHEET_HEIGHT, { duration: 220 });
        runOnJS(onClose)();
        } else {
        // Not far enough → snap back to open position
        translateY.value = withSpring(0, { damping: 18, stiffness: 180 });
        }
    });

  // Render
  return (
    <Modal
        visible={visible}
        transparent={true}          // keeps background visible
        animationType="none"        // we handle animation ourselves with Reanimated
        statusBarTranslucent={true} // covers status bar too on Android
        onRequestClose={onClose}    // Android back button closes sheet
    >
      {/* ── Backdrop ── */}
      {/* Semi-transparent dark layer behind the sheet.        */}
      {/* Tapping it closes the sheet.                         */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.backdrop, backdropStyle]} />
      </TouchableWithoutFeedback>

      {/* ── Bottom Sheet ──*/}
      <Animated.View style={[styles.sheet, sheetStyle]}>

        {/* Drag handle — touch and swipe down to close */}
        <GestureDetector gesture={panGesture}>
            {/* Larger touch area than the visual pill */}
            <View style={styles.dragArea}>
                <View style={styles.handleBar} />
            </View>
        </GestureDetector>

        {/* ── Friend Header ──── */}
        <View style={styles.header}>
          {/* Avatar: show image if available, otherwise show initial */}
          {friend?.avatar_url ? (
            <Image
              source={{ uri: friend.avatar_url }}
              style={styles.avatar}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitial}>
                {(friend?.full_name ?? friend?.username ?? '?')
                  .charAt(0)
                  .toUpperCase()}
              </Text>
            </View>
          )}

          <Text style={styles.friendName} numberOfLines={1}>
            Send to{' '}
            <Text style={styles.friendNameBold}>
              {friend?.full_name ?? friend?.username ?? ''}
            </Text>
          </Text>
        </View>

        {/* ── Sticker Row ────*/}
        <FlatList
            data={STICKERS}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: -40 }} 
            contentContainerStyle={styles.stickerRow}

            // ── Scroll tracking ──────────────────────────────────
            onScrollBeginDrag={() => {
                isScrolling.current = true;   // finger started scrolling
            }}
            onScrollEndDrag={() => {
                // small delay so onPressOut sees the flag before it clears
                setTimeout(() => { isScrolling.current = false; }, 150);
            }}
            onMomentumScrollEnd={() => {
                isScrolling.current = false;  // scroll fully stopped
            }}

            renderItem={({ item }) => (
                <StickerButton
                sticker={item}
                isScrolling={isScrolling}   
                onSend={(sticker, sizeMultiplier) => {
                    onSend(sticker, sizeMultiplier);
                }}
                />
            )}
            />
      </Animated.View>
    </Modal>
  );
}

// ── Styles ────
const styles = StyleSheet.create({
  // Covers the full screen — sits on top of the map
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },

  // The white card that slides up from the bottom
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 16,
    // Shadow so the sheet looks elevated above the map
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 12, // Android shadow
  },

  // Friend name + avatar row
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },

  avatar: {
    width: 46,
    height: 46,
    borderRadius: 28,
    marginRight: 10,
  },

  avatarFallback: {
    backgroundColor: '#a78bfa', // purple fallback
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarInitial: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },

  friendName: {
    fontSize: 14,
    color: '#555',
    flexShrink: 1,
  },

  friendNameBold: {
    fontWeight: '700',
    color: '#111',
  },

  // Padding around the FlatList of stickers
  stickerRow: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignItems: 'center',
  },

    dragArea: {
        alignSelf: 'stretch',
        alignItems: 'center',
        paddingVertical: 12,  // extra touch area above and below the pill
    },

    // The small pill handle (visual only)
    handleBar: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#ddd',
    },
});