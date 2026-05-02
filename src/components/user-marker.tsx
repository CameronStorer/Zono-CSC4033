import { View, Image, Text, StyleSheet } from 'react-native';
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
            tracksViewChanges={true}
        >
            <View style={styles.pin}>
                <View style={styles.avatarCircle}>
                    <Image
                        source={ avatarUrl ? { uri: avatarUrl } : require('@/assets/images/default-avatar.png') }
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
        zIndex: 1,
    },
    avatarCircle: {
        width: 30,
        height: 30,
        borderRadius: 21,
        borderWidth: 3,
        borderColor: '#ff0000',
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
    },
    point: {
        width: 0,
        height: 0,
        borderLeftWidth: 8,
        borderRightWidth: 8,
        borderTopWidth: 5,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: '#ff0000',
        marginTop: -2,
    },
});