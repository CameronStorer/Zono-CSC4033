import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import MapView, { Polygon } from 'react-native-maps';
import type { Region } from 'react-native-maps';
import { View, Text, ActivityIndicator, Linking, TouchableOpacity } from 'react-native';
import * as Location from 'expo-location';
import { useAuth } from '@/components/auth-context';
import UserMarker from '@/components/user-marker';
import { supabase } from '@/components/supabase';
import { useAppTheme } from '@/contexts/theme-context';
import { darkMapStyle } from '@/constants/map-styles';
import { SlideScreen } from '@/components/slide-screen';
import { makeStyles } from './_styles';

const CELL_SIZE_DEG = 0.01;
const MAX_VISIBLE_CELLS = 400;

const SCRATCH_FILL = 'rgba(139,92,246,0.18)';
const SCRATCH_BORDER = 'rgba(139,92,246,1)';
const SCRATCH_STROKE_REVEALED = 'rgba(139,92,246,1)';
const SCRATCH_BORDER_WIDTH = 2;

function cellIdToPolygon(cellId: string): { latitude: number; longitude: number }[] {
  const [x, y] = cellId.split('_').map(Number);
  const lngMin = x * CELL_SIZE_DEG;
  const latMin = y * CELL_SIZE_DEG;
  const lngMax = (x + 1) * CELL_SIZE_DEG;
  const latMax = (y + 1) * CELL_SIZE_DEG;
  return [
    { latitude: latMin, longitude: lngMin },
    { latitude: latMax, longitude: lngMin },
    { latitude: latMax, longitude: lngMax },
    { latitude: latMin, longitude: lngMax },
  ];
}

function coordsToCellId(latitude: number, longitude: number): string {
  const x = Math.floor(longitude / CELL_SIZE_DEG);
  const y = Math.floor(latitude / CELL_SIZE_DEG);
  return `${x}_${y}`;
}

function visibleCellIdsForRegion(region: Region): string[] {
  const halfLat = region.latitudeDelta / 2;
  const halfLng = region.longitudeDelta / 2;
  const north = region.latitude + halfLat;
  const south = region.latitude - halfLat;
  const east = region.longitude + halfLng;
  const west = region.longitude - halfLng;

  const minX = Math.floor(west / CELL_SIZE_DEG);
  const maxX = Math.floor(east / CELL_SIZE_DEG);
  const minY = Math.floor(south / CELL_SIZE_DEG);
  const maxY = Math.floor(north / CELL_SIZE_DEG);

  const count = (maxX - minX + 1) * (maxY - minY + 1);
  if (count > MAX_VISIBLE_CELLS) return [];

  const ids: string[] = [];
  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      ids.push(`${x}_${y}`);
    }
  }
  return ids;
}

export default function Map() {
  const { colors: C, resolved } = useAppTheme();
  const styles = useMemo(() => makeStyles(C), [resolved]);

  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [visitedSet, setVisitedSet] = useState<Set<string>>(new Set());
  const mapRef = useRef<MapView>(null);
  const { profile } = useAuth();
  const lastMarkedCellId = useRef<string | null>(null);
  const [visitedLoaded, setVisitedLoaded] = useState(false);

  const initials = profile?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) ?? '?';

  useEffect(() => {
    if (!profile?.id) return;
    (async () => {
      const { data, error } = await supabase
        .from('visited_cells')
        .select('cell_id')
        .eq('user_id', profile.id);
      if (error) {
        console.warn('scratch-map: failed to fetch visited_cells', error);
        return;
      }
      console.log(`scratch-map: loaded ${data?.length ?? 0} visited cells`);
      if (data) setVisitedSet(new Set(data.map(r => r.cell_id)));
      setVisitedLoaded(true);
    })();
  }, [profile?.id]);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;
    async function setupLocation() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setPermissionGranted(false); return; }
      setPermissionGranted(true);
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.BestForNavigation });
      setUserLocation(loc);
      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 10000, distanceInterval: 10 },
        setUserLocation,
      );
    }
    setupLocation();
    return () => { subscription?.remove(); };
  }, []);

  useEffect(() => {
    if (!userLocation || !profile?.id || !visitedLoaded) return;

    const cellId = coordsToCellId(
      userLocation.coords.latitude,
      userLocation.coords.longitude,
    );

    if (lastMarkedCellId.current === cellId) return;
    lastMarkedCellId.current = cellId;

    if (visitedSet.has(cellId)) return;

    setVisitedSet(prev => new Set(prev).add(cellId));

    supabase
      .from('visited_cells')
      .insert({ user_id: profile.id, cell_id: cellId })
      .then(({ error }) => {
        if (error) {
          console.warn('scratch-map: failed to mark cell visited', error);
          setVisitedSet(prev => {
            const next = new Set(prev);
            next.delete(cellId);
            return next;
          });
        }
      });
  }, [userLocation, profile?.id, visitedLoaded]);

  const handleRegionChange = useCallback((r: Region) => setRegion(r), []);

  const visibleCells = useMemo(() => {
    if (!region) return [];
    return visibleCellIdsForRegion(region);
  }, [region]);

  const { covered, revealed } = useMemo(() => {
    const c: string[] = [];
    const r: string[] = [];
    for (const id of visibleCells) {
      if (visitedSet.has(id)) r.push(id);
      else c.push(id);
    }
    return { covered: c, revealed: r };
  }, [visibleCells, visitedSet]);

  if (permissionGranted === null || (permissionGranted === true && userLocation === null)) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', gap: 12, backgroundColor: C.bg }]}>
        <ActivityIndicator size="large" color={C.accent} />
        <Text style={{ color: C.text }}>Getting your location...</Text>
      </View>
    );
  }

  if (permissionGranted === false) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', gap: 12, padding: 24, backgroundColor: C.bg }]}>
        <Text style={{ fontSize: 16, textAlign: 'center', color: C.text }}>Location access is required to use the map.</Text>
        <Text style={{ textAlign: 'center', color: C.textSecondary }}>Please enable it in your device settings.</Text>
        <TouchableOpacity
          onPress={() => Linking.openSettings()}
          style={{ marginTop: 8, backgroundColor: C.mapOpenSettingsBtn, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 }}
        >
          <Text style={{ fontWeight: '600' }}>Open Settings</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SlideScreen index={0}>
      <View style={styles.container}>
        <MapView
          ref={mapRef}
          style={styles.map}
          userInterfaceStyle={resolved}
          customMapStyle={resolved === 'dark' ? darkMapStyle : []}
          initialRegion={{
            latitude: userLocation!.coords.latitude,
            longitude: userLocation!.coords.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
          onRegionChangeComplete={handleRegionChange}
        >
          <UserMarker
            coordinate={{
              latitude: userLocation!.coords.latitude,
              longitude: userLocation!.coords.longitude,
            }}
            avatarUrl={profile?.avatar_url ?? null}
            initials={initials}
          />

          {/* Covered (unvisited) cells — purple overlay hiding the map */}
          {covered.map((cellId) => (
            <Polygon
              key={cellId}
              coordinates={cellIdToPolygon(cellId)}
              strokeColor={SCRATCH_BORDER}
              fillColor={SCRATCH_FILL}
              strokeWidth={SCRATCH_BORDER_WIDTH}
            />
          ))}

          {/* Revealed (visited) cells — transparent, showing the map underneath */}
          {revealed.map((cellId) => (
            <Polygon
              key={cellId}
              coordinates={cellIdToPolygon(cellId)}
              strokeColor={SCRATCH_STROKE_REVEALED}
              fillColor="transparent"
              strokeWidth={2}
            />
          ))}
        </MapView>

        {region && visibleCells.length === 0 && (
          <View style={{
            position: 'absolute', top: 60, right: 16,
            backgroundColor: C.bg + 'dd', paddingHorizontal: 12, paddingVertical: 6,
            borderRadius: 8,
          }}>
            <Text style={{ color: C.text, fontSize: 12 }}>Zoom in to scratch</Text>
          </View>
        )}
      </View>
    </SlideScreen>
  );
}
