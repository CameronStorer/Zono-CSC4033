import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Dimensions } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

const { width, height } = Dimensions.get('window');

export function AnimatedSplashOverlay() {
  const [isAppReady, setAppReady] = useState(false);
  const animation = useRef(new Animated.Value(1)).current; // Opacity 1 to 0
  const scale = useRef(new Animated.Value(1)).current;     // Scale 1 to 1.5

  useEffect(() => {
    async function prepare() {
      try {
        // Keep the native splash visible while we load resources
        await SplashScreen.preventAutoHideAsync();
        // Simulate a small delay for the animation to feel natural
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppReady(true);
      }
    }
    prepare();
  }, []);

  useEffect(() => {
    if (isAppReady) {
      // Run both Opacity and Scale animations together
      Animated.parallel([
        Animated.timing(animation, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1.5,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Once our animation finishes, hide the native splash
        SplashScreen.hideAsync();
      });
    }
  }, [isAppReady]);

  if (!isAppReady) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: '#000000', // Match your splash.png background color
          opacity: animation,
          transform: [{ scale }],
          zIndex: 9999, // Ensure it stays on top during transition
        },
      ]}
    >
      {/* Optional: If you want an icon to animate specifically, 
        add an <Animated.Image /> here matching your splash icon 
      */}
    </Animated.View>
  );
}