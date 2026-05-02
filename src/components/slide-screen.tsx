import React, { useRef, useCallback } from 'react';
import { Animated, Dimensions, Easing } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useTabNav } from '@/contexts/tab-nav-context';

const SCREEN_WIDTH = Dimensions.get('window').width;

export function SlideScreen({ children, index }: { children: React.ReactNode; index: number }) {
  const translateX = useRef(new Animated.Value(0)).current;
  const { getPrevIndex, setCurrentIndex } = useTabNav();
  const firstFocus = useRef(true);

  useFocusEffect(
    useCallback(() => {
      const prevIdx = getPrevIndex();
      setCurrentIndex(index);

      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }

      const startX = index > prevIdx ? SCREEN_WIDTH : -SCREEN_WIDTH;
      translateX.setValue(startX);

      Animated.timing(translateX, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.poly(4)),
        useNativeDriver: true,
      }).start();
    }, [index])
  );

  return (
    <Animated.View style={{ flex: 1, transform: [{ translateX }] }}>
      {children}
    </Animated.View>
  );
}
