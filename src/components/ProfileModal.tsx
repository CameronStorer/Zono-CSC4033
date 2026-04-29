import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

type ProfileModalProps = {
  visible: boolean;
  onClose: () => void;
};

export default function ProfileModal({ visible, onClose }: ProfileModalProps) {
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
            <Text style={styles.avatarIcon}>👤</Text>
          </View>

          <Text style={styles.name}>Iris</Text>
          <Text style={styles.username}>@iris</Text>

          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>Profile</Text>
            <Text style={styles.cardText}>Friends: 1</Text>
            <Text style={styles.cardText}>Status: Online</Text>
            <Text style={styles.cardText}>Location sharing: On</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>Add more friends</Text>
            <Text style={styles.cardText}>
              Profile picture can be added later from Supabase Storage.
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