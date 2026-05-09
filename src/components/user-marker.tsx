import React, { useEffect, useState } from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { useAppTheme } from '@/contexts/theme-context';

// ── Fixed dimensions ─────────────────────────────────────────────────────────
// All measurements are explicit so the anchor calculation is stable at every
// zoom level (prevents the "northwest drift" bug in react-native-maps).
const CIRCLE  = 38;          // outer circle diameter (includes border)
const BORDER  = 3;           // circle border width
const INNER   = CIRCLE - BORDER * 2;   // 32 — avatar / initials area
const TRI_H   = 10;          // triangle height (borderTopWidth)
const TRI_W   = 9;           // triangle half-width
const OVERLAP = 2;           // pixels the triangle overlaps the circle
const PIN_W   = CIRCLE;                // 38
const PIN_H   = CIRCLE + TRI_H - OVERLAP; // 46 — total marker height

export type UserMarkerProps = {
  coordinate: { latitude: number; longitude: number };
  avatarUrl: string | null;
  initials?: string;
  onPress?: () => void;
  /** Border / tip colour. Defaults to green for the current-user marker. */
  borderColor?: string;
  /** Fallback background when no avatar. Defaults to theme accent. */
  accentColor?: string;
};

export default function UserMarker({
  coordinate,
  avatarUrl,
  initials,
  onPress,
  borderColor = '#89faa7',
  accentColor,
}: UserMarkerProps) {
  const { colors: C } = useAppTheme();
  const bg = accentColor ?? C.accent;

  // Keep tracksViewChanges=true long enough for network avatars to paint,
  // then disable so the marker doesn't re-render on every frame.
  const [tracking, setTracking] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setTracking(false), 2500);
    return () => clearTimeout(t);
  }, []);

  return (
    <Marker
      coordinate={coordinate}
      anchor={{ x: 0.5, y: 1 }}
      tracksViewChanges={tracking}
      onPress={onPress}
    >
      {/*
        collapsable={false} prevents React Native from flattening this view,
        which would otherwise corrupt the anchor origin on Android.
        The fixed width/height ensure the anchor pixel is always consistent.
      */}
      <View collapsable={false} style={{ width: PIN_W, height: PIN_H, alignItems: 'center' }}>
        <View style={[styles.circle, { borderColor }]}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.initialsBox, { backgroundColor: bg }]}>
              <Text style={styles.initialsText}>{initials ?? '?'}</Text>
            </View>
          )}
        </View>
        <View style={[styles.triangle, { borderTopColor: borderColor }]} />
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  circle: {
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    borderWidth: BORDER,
    backgroundColor: '#fff',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  avatar: {
    width: INNER,
    height: INNER,
    borderRadius: INNER / 2,
  },
  initialsBox: {
    width: INNER,
    height: INNER,
    borderRadius: INNER / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  triangle: {
    width: 0,
    height: 0,
    borderLeftWidth: TRI_W,
    borderRightWidth: TRI_W,
    borderTopWidth: TRI_H,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -OVERLAP,
  },
});
