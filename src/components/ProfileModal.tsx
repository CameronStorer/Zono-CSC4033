import { UserProfile } from '@/services/profileService';
import React from 'react';
import {Modal,View,Text,TouchableOpacity,StyleSheet,Image, FlatList} from 'react-native';

type ProfileModalProps = {
  visible: boolean;
  onClose: () => void;
  profile: UserProfile | null;
};

export default function ProfileModal({ visible, onClose, profile}: ProfileModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.panel}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>

          <View style={styles.avatarCircle}>
            {profile?.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                style={styles.avatarImage}
              />
            ) : (
              <Image
                source={require('../../assets/images/default-avatar.png')}
                style={styles.avatarImage}
              />
            )}
          </View>

          <Text style={styles.name}>
            {profile?.full_name || 'Unknown User'}
          </Text>
          <Text style={styles.username}>
            @{profile?.username || 'username'}
          </Text>

          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>Profile</Text>
            <Text style={styles.cardText}>Friends: 1</Text>
            <Text style={styles.cardText}>
              Status: {profile?.status || 'No status'}
            </Text>
            <Text style={styles.cardText}>
              Location sharing: {profile?.location_sharing || 'Unknown'}
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>Bio</Text>
            <Text style={styles.cardText}>
              Bio: {profile?.bio || 'No bio yet'}
            </Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>Friends</Text>
            <Text style={styles.cardText}>
              Bio: {profile?.bio || 'No Friends'}
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },

  panel: {
    minHeight: '82%',
    backgroundColor: '#f4f4f4',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    padding: 24,
    alignItems: 'center',
  },

  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#cfcfcf',
    alignItems: 'center',
    justifyContent: 'center',
  },

  closeButtonText: {
    color: 'white',
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 30,
  },

  avatarCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -60,
    borderWidth: 4,
    borderColor: 'white',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 55,
  },

  avatarIcon: {
    fontSize: 56,
  },

  name: {
    fontSize: 34,
    fontWeight: '700',
    marginTop: 12,
  },

  username: {
    fontSize: 20,
    color: '#999',
    marginBottom: 28,
  },

  infoCard: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
  },

  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },

  cardText: {
    fontSize: 16,
    color: '#555',
    marginBottom: 4,
  },
  
});