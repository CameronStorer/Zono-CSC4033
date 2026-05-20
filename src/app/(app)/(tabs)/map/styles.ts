import { StyleSheet, View, Text, Modal, TextInput, TouchableOpacity, FlatList, } from 'react-native';


export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },

  calloutBox: {
    minWidth: 160,
    padding: 4,
  },
  calloutTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },

  bottomCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 90,
    backgroundColor: '#80e0db',
    padding: 16,
    borderRadius: 16,
  },

  cardTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 6,
    color: 'white',
  },

  addFriendCircle: {
    position: 'absolute',
    top: 70,
    right: 20,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#4da6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },

  profileCircle: {
    position: 'absolute',
    top: 60,
    left: 20,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    zIndex: 20,
    elevation: 8,
    // small shadow for iOS
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },

  profileCircleText: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
  },

  profileAvatar: {
  width: '100%',
  height: '100%',
  borderRadius: 27,
  },

  bellCircle: {
    position: 'absolute',
    top: 135,
    right: 20,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#75d1ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleButtonText: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'flex-start',
    paddingTop: 110,
    paddingHorizontal: 16,
  },
  modalCard: {
    backgroundColor: 'white',
    borderRadius: 22,
    padding: 16,
    maxHeight: '70%',
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#d9d9d9',
    borderRadius: 14,
    paddingHorizontal: 14,
    marginRight: 10,
    backgroundColor: '#fafafa',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#efefef',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  searchInfoText: {
    textAlign: 'center',
    color: '#666',
    marginVertical: 12,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  resultTextBox: {
    flex: 1,
    marginRight: 10,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600',
  },
  resultUsername: {
    fontSize: 14,
    color: '#777',
    marginTop: 2,
  },
  addButton: {
    backgroundColor: '#4da6ff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  requestedButton: {
    backgroundColor: '#9e9e9e',
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
  },


});