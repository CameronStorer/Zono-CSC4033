
import React from 'react';
import {Modal,View,Text,TouchableOpacity,Image,FlatList,StyleSheet} from 'react-native';

type Props = {
  visible: boolean;
  onClose: () => void;
  requests: any[];
  onAccept: (requestId: number, senderId: number) => void;
  onDelete: (requestId: number) => void;
};

function getInitials(name?: string, username?: string) {
  const displayName = name || username || 'User';
  const words = displayName.trim().split(' ');

  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }

  return displayName.slice(0, 2).toUpperCase();
}

export default function FriendRequestNotificationModal({visible,onClose,requests,onAccept,onDelete,}: Props) {
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

          {requests.length === 0 ? (
            <Text style={styles.emptyText}>No notifications right now</Text>
          ) : (
            <FlatList
              data={requests}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => {
                const user = item.users;
                const fullName = user?.full_name || user?.username || 'Unknown User';
                const username = user?.username || 'unknown';
                const initials = getInitials(user?.full_name, user?.username);

                return (
                  <View style={styles.requestPage}>
                    <Text style={styles.fullName}>{fullName}</Text>
                    <Text style={styles.username}>@{username}</Text>

                    {user?.avatar_url ? (
                      <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
                    ) : (
                      <View style={styles.initialAvatar}>
                        <Text style={styles.initialText}>{initials}</Text>
                      </View>
                    )}

                    <Text style={styles.friendCount}>0 friends on Zono</Text>

                    <Text style={styles.message}>
                      wants to be your friend
                    </Text>

                    <View style={styles.buttonRow}>
                      <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => onAccept(item.id, user.id)}
                      >
                        <Text style={styles.addButtonText}>+ Add</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => onDelete(item.id)}
                      >
                        <Text style={styles.deleteButtonText}>Delete</Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.contactText}>not in your contacts</Text>
                  </View>
                );
              }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  card: {
    width: '82%',
    maxHeight: '80%',
    backgroundColor: '#f7f3ef',
    borderRadius: 28,
    padding: 24,
  },

  closeButton: {
    alignSelf: 'flex-end',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#999',
    justifyContent: 'center',
    alignItems: 'center',
  },

  closeText: {
    color: 'white',
    fontWeight: 'bold',
  },

  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    marginVertical: 40,
  },

  requestBox: {
    alignItems: 'center',
    paddingVertical: 18,
  },

  fullName: {
    fontSize: 28,
    fontWeight: '600',
  },

  username: {
    fontSize: 20,
    color: '#999',
    marginBottom: 24,
  },

  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 20,
  },

  initialAvatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 4,
    borderColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },

  initialText: {
    fontSize: 30,
    fontWeight: 'bold',
  },

  friendCount: {
    fontSize: 11,
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 18,
  },

  message: {
    fontSize: 17,
    marginBottom: 24,
  },

  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },

  addButton: {
    backgroundColor: '#2f63ff',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 18,
  },

  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  deleteButton: {
    backgroundColor: '#ddd',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 18,
  },

  deleteButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },

  contactText: {
    marginTop: 24,
    fontSize: 11,
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  requestPage: {
    width: 300,
    alignItems: 'center',
    paddingVertical: 18,
},
});