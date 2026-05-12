// db-styles.ts
import { StyleSheet, Dimensions, Platform } from 'react-native';
import { Spacing } from '@/constants/theme';

export const styles = StyleSheet.create({
  container: { 
    padding: 20, 
    paddingBottom: 100 
  },
  headerActionRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  pageTitle: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#fff' 
  },
  addButton: { 
    backgroundColor: '#6200ee', 
    paddingHorizontal: 15, 
    paddingVertical: 8, 
    borderRadius: 8 
  },
  chartCard: { 
    marginBottom: 25, 
    alignItems: 'center' 
  },
  chartTitle: { 
    color: '#aaa', 
    marginBottom: 10, 
    alignSelf: 'flex-start' 
  },
  tableCard: { 
    backgroundColor: '#16161d', 
    borderRadius: 12, 
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333'
  },
  colHeaderRow: { 
    flexDirection: 'row', 
    backgroundColor: '#1f1f27', 
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333'
  },
  headerCell: { 
    color: '#888', 
    fontWeight: 'bold', 
    paddingHorizontal: 10 
  },
  dataRow: { 
    flexDirection: 'row', 
    paddingVertical: 15, 
    borderBottomWidth: 1, 
    borderBottomColor: '#222',
    alignItems: 'center'
  },
  dataCell: { 
    color: '#eee', 
    paddingHorizontal: 10 
  },
  actionCell: { 
    flexDirection: 'row', 
    justifyContent: 'space-around' 
  },
  editBtn: { 
    color: '#4dabf7', 
    fontWeight: '600' 
  },
  deleteBtn: { 
    color: '#ff6b6b', 
    fontWeight: '600' 
  },
  input: { 
    backgroundColor: '#0a0a0f', 
    color: '#fff', 
    padding: 12, 
    borderRadius: 8, 
    marginBottom: 15, 
    borderWidth: 1, 
    borderColor: '#333', // Subtle border
    fontSize: 16,
    // Add a slight shadow for depth
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  overlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.85)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  content: { 
    backgroundColor: '#16161d', 
    padding: 25, 
    borderRadius: 20, 
    width: '90%', 
    maxWidth: 400, 
    borderWidth: 1, 
    borderColor: '#333' 
  },
  title: { 
    color: '#fff', 
    fontSize: 22, 
    fontWeight: 'bold', 
    marginBottom: 20 
  },
  // container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
  },
    statusText: {
    marginBottom: 20,
    fontSize: 18,
    fontWeight: '600',
  },
  switchTrack: {
    width: 60,
    height: 34,
    borderRadius: 17, // Half of height to make it a pill shape
    padding: 2,        // Space between track edge and thumb
    justifyContent: 'center',
  },
  thumb: {
    width: 26,
    height: 26,
    borderRadius: 13, // Half of width to make it a circle
    backgroundColor: 'white',
    // Add a little shadow to make the thumb "pop"
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 4, // For Android shadow
  },
});