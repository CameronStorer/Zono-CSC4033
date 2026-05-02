import React, { useEffect, useRef } from 'react';
import { View, Image, Text, StyleSheet, Animated } from 'react-native';
import { Marker } from 'react-native-maps';

export type UserMarkerProps = {
    coordinate: { 
        latitude: number; longitude: number 
    };
    avatarUrl: string | null; // subject to change, depends on how supabase image caching works out
};

export default function UserMarker({ coordinate, avatarUrl }: UserMarkerProps) {
    return (
        <Marker
            coordinate={coordinate}
            anchor={{ x: 0.5, y: 1 }}
            tracksViewChanges={false}
        >
            <View style={styles.pin}>
                <View style={styles.avatarCircle}>
                    <Image
                        source={ avatarUrl ? { uri: avatarUrl } : require('@/assets/images/default-pfp.png') }
                        style={styles.avatar}
                    />
                </View>
                <View style={styles.point} />
            </View>
        </Marker>
    );
}

const styles = StyleSheet.create({
    pin: {
        alignItems: 'center',
    },
    avatarCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 3,
        borderColor: '#5862f7',
        backgroundColor: 'white',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    avatar: {
        width: 42,
        height: 42,
    },
    point: {
        width: 0,
        height: 0,
        borderLeftWidth: 7,
        borderRightWidth: 7,
        borderTopWidth: 10,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: '#5862f7',
    },
});