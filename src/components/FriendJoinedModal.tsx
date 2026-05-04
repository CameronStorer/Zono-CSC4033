import React from 'react';
import {Modal,View,Text,Image,TouchableOpacity,StyleSheet,} from 'react-native';

type Props = {
  visible: boolean;
  friend: any | null;
  onClose: () => void;
};

function formatTime(dateString?: string) {
  if (!dateString) return 'just now';

  return new Date(dateString).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function FriendJoinedModal({
  visible,
  friend,
  onClose,
}: Props) {
  if (!friend) return null;

  const user = friend.users;
  const fullName = user?.full_name || user?.username || 'New User';
  const username = user?.username || 'unknown';
  const avatarUrl = user?.avatar_url;
  const acceptedTime = formatTime(friend.accepted_at);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>

          <Image
            source={require('@/assets/images/notification-icon.png')}
            style={styles.bell}
            resizeMode="contain"
          />

          <View style={styles.userRow}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarText}>
                  {fullName.slice(0, 2).toUpperCase()}
                </Text>
              </View>
            )}

            <View>
              <Text style={styles.name}>
                {fullName} <Text style={styles.time}>• {acceptedTime}</Text>
              </Text>
              <Text style={styles.username}>@{username}</Text>
            </View>
          </View>

          <View style={styles.messageBox}>
            <View style={styles.redDot} />

            <Text style={styles.message}>
              {fullName} just joined your friend list
            </Text>

            <Text style={styles.subMessage}>
              See what they’re up to right now!
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
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  card: {
    width: '88%',
    backgroundColor: '#faf8f2',
    borderRadius: 30,
    padding: 24,
    alignItems: 'center',
  },

  closeButton: {
    alignSelf: 'flex-end',
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#999',
    justifyContent: 'center',
    alignItems: 'center',
  },

  closeText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },

  bell: {
    width: 110,
    height: 110,
    marginBottom: 24,
  },

  userRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },

  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    marginRight: 12,
    borderWidth: 4,
    borderColor: '#7cff7c',
  },

  avatarFallback: {
    width: 58,
    height: 58,
    borderRadius: 29,
    marginRight: 12,
    backgroundColor: '#2f63ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#7cff7c',
  },

  avatarText: {
    color: 'white',
    fontWeight: '700',
  },

  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
  },

  time: {
    fontWeight: '400',
    color: '#888',
  },

  username: {
    marginTop: 2,
    fontSize: 14,
    color: '#999',
  },

  messageBox: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 22,
    paddingVertical: 20,
    paddingHorizontal: 18,
    shadowColor: '#1e00ff',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },

  redDot: {
    position: 'absolute',
    top: -7,
    right: -5,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'red',
  },

  message: {
    color: '#2f3cff',
    fontSize: 19,
    fontWeight: '700',
  },

  subMessage: {
    marginTop: 4,
    color: '#aaa',
    fontSize: 15,
    fontWeight: '600',
  },
});