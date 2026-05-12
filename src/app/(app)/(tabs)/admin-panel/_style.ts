import { StyleSheet, Platform } from 'react-native';
import { AppColors } from '@/constants/theme';

export const makeStyles = (C: AppColors) => StyleSheet.create({
  container: { padding: 20, paddingBottom: 100 },
  headerActionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  pageTitle: { fontSize: 24, fontWeight: 'bold', color: C.text },
  addButton: { backgroundColor: '#6200ee', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8 },
  chartCard: { marginBottom: 25, alignItems: 'center' },
  chartTitle: { color: C.textSecondary, marginBottom: 10, alignSelf: 'flex-start' },
  tableCard: { backgroundColor: C.bgElement, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: C.borderMuted },
  colHeaderRow: { flexDirection: 'row', backgroundColor: C.bgElevated, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.borderMuted },
  headerCell: { color: C.textSecondary, fontWeight: 'bold', paddingHorizontal: 10 },
  dataRow: { flexDirection: 'row', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: C.border, alignItems: 'center' },
  dataCell: { color: C.text, paddingHorizontal: 10 },
  actionCell: { flexDirection: 'row', justifyContent: 'space-around' },
  editBtn: { color: '#4dabf7', fontWeight: '600' },
  deleteBtn: { color: C.destructive, fontWeight: '600' },
  input: {
    backgroundColor: C.bgInput,
    color: C.text,
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: C.borderMuted,
    fontSize: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 4 },
      android: { elevation: 3 },
    }),
  },
  // Modal styles (moved here so they can be themed)
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: C.bgElement, padding: 25, borderRadius: 20, width: '90%', maxWidth: 400, borderWidth: 1, borderColor: C.borderMuted },
  modalTitle: { color: C.text, fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
});
