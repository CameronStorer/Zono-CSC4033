import { View, Image, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { useAppTheme } from '@/contexts/theme-context';

export type UserMarkerProps = {
    coordinate: {
        latitude: number; longitude: number
    };
    avatarUrl: string | null;
    initials?: string;
};

export default function UserMarker({ coordinate, avatarUrl, initials }: UserMarkerProps) {
    const { colors: C } = useAppTheme();

    return (
        <Marker
            coordinate={coordinate}
            anchor={{ x: 0.5, y: 1 }}
            tracksViewChanges={true}
        >
            <View style={styles.pin}>
                <View style={styles.avatarCircle}>
                    {avatarUrl
                        ? <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                        : <View style={[styles.avatar, { backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' }]}>
                            <Text style={{ color: '#fff', fontSize: 9, fontWeight: 'bold' }}>
                                {initials ?? '?'}
                            </Text>
                          </View>
                    }
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
        borderColor: '#89faa7',
        backgroundColor: 'white',
        overflow: 'hidden',
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
        borderTopColor: '#89faa7',
        marginTop: -2,
    },
});
