import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, Text, ScrollView, ActivityIndicator, TouchableOpacity, 
  Alert, Dimensions, Modal, TextInput, RefreshControl, StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-chart-kit';
import { DATABASE_CONFIG, fetchTableData, deleteRow, upsertRow } from '@/app/(app)/database/logic';
import { styles } from '@/app/(app)/database/style'; // Use your external styles
import { supabase } from '@/app/(app)/database/supabase';

// admin panel page
export default function AdminPanel() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State
  const [isModalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ username: '', email: '', phone_number: '', full_name: ''});

  const config = DATABASE_CONFIG.users;
  const screenWidth = Dimensions.get("window").width;

  // initial loading of table data
  const loadData = async () => {
    try {
      // call fetch table data func
      const result = await fetchTableData(config.table);
      setData(result || []);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      // is complete when no longer loading/refreshing
      setLoading(false);
      setRefreshing(false);
    }
  };

  // load the table first
  useEffect(() => { loadData(); }, []);

  // on refresh load data + update state
  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // confirm deletion pop-up logic
  const confirmDelete = (id: string) => {
    Alert.alert(
      "Confirm Delete", 
      "Are you sure you want to remove this user? This action cannot be undone.", 
      [
        { 
          text: "Cancel", 
          style: "cancel" 
        },
        { 
          text: "Delete", 
          style: 'destructive', 
          onPress: async () => {
            try {
              setLoading(true); // Show spinner while deleting
              
              // We use the service function from your db-react-logic
              await deleteRow(config.table, id);
              
              // Refresh the table so the user disappears immediately
              await loadData();
              
              console.log(`Successfully deleted user: ${id}`);
            } catch (e: any) {
              Alert.alert("Delete Failed", e.message);
            } finally {
              setLoading(false);
            }
          } 
        }
      ]
    );
  };

  // Logic: Filter data based on search
  const filteredData = useMemo(() => {
    return data.filter(item => 
      item.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [data, searchQuery]);

  // simple user input func for creating new user
  const handleSave = async () => {
    const { username, email, phone_number, full_name } = formData;

    // 1. FRONTEND PRE-FLIGHT VALIDATION (UX Layer)
    const unRegex = /^[a-zA-Z0-9_]+$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    const nameRegex = /^[a-zA-Z\s]+$/;

    if (!username || !email) {
      return Alert.alert("Required", "Username, and Email are mandatory.");
    }

    if (!unRegex.test(username)) {
      return Alert.alert("Validation Error", "Username must be alphanumeric (underscores allowed) with no spaces.");
    }

    if (!emailRegex.test(email)) {
      return Alert.alert("Validation Error", "Please enter a valid email address.");
    }

    if (phone_number && !phoneRegex.test(phone_number)) {
      return Alert.alert("Validation Error", "Phone number must be 10-15 digits.");
    }

    if (full_name && !nameRegex.test(full_name)) {
      return Alert.alert("Validation Error", "Name can only contain letters and spaces.");
    }

    setLoading(true);

    try {
      // 2. DATABASE EXECUTION (Security Layer)
      const action = editingId 
        ? supabase.from(config.table).update(formData).eq('id', editingId)
        : supabase.from(config.table).insert([formData]);

      const { error } = await action;

      if (error) {
        // Postgres error 23514 is a Check Constraint violation
        if (error.code === '23514') {
          Alert.alert(
            "Database Rejected", 
            "The data format is invalid according to system rules. Please double-check all fields."
          );
        } else {
          Alert.alert("Database Error", error.message);
        }
        return; 
      }

      // 3. SUCCESS & UI RESET
      setModalVisible(false);
      setEditingId(null);
      setFormData({ username: '', email: '', phone_number: '', full_name: '' });
      loadData();
      
    } catch (e: any) {
      console.error(e);
      Alert.alert("System Error", "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // simple func to display the data in a more user-friendly way for the admin panel's chart
  const getChartData = () => {
    if (data.length === 0) return { labels: ["None"], datasets: [{ data: [0] }] };

    // 1. Group registrations by date string (YYYY-MM-DD)
    const counts: { [key: string]: number } = {};
    data.forEach(user => {
      const date = new Date(user.created_at).toISOString().split('T')[0];
      counts[date] = (counts[date] || 0) + 1;
    });

    // 2. Sort dates chronologically
    const sortedDates = Object.keys(counts).sort();

    // 3. Calculate running total (Cumulative Growth)
    let cumulative = 0;
    const cumulativeData = sortedDates.map(date => {
      cumulative += counts[date];
      return cumulative;
    });

    // 4. Formatting labels for the UI (e.g., "Apr 20")
    const labels = sortedDates.map(date => {
      const d = new Date(date);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    });

    // Only show the last 6 data points so the chart doesn't get crowded
    return {
      labels: labels.slice(-6),
      datasets: [{
        data: cumulativeData.slice(-6)
      }]
    };
  };

  // admin panel page structure
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a0f' }}>
      <ScrollView 
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6200ee" />}
      >
        <View style={styles.headerActionRow}>
          <View>
            <Text style={styles.pageTitle}>{config.label}</Text>
            <Text style={{ color: '#666' }}>{data.length} Total Records</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={() => {setEditingId(null); setFormData({username:'', email:'', phone_number:'', full_name:''}); setModalVisible(true)}}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>+ New User</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <TextInput 
          style={[styles.input, { marginBottom: 20 }]} 
          placeholder="Search by name or email..." 
          placeholderTextColor="#555"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {/* Analytics Section */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Registration Trend</Text>
          <LineChart 
            data={getChartData()} 
            width={screenWidth - 40} 
            height={180} 
            chartConfig={chartConfig} 
            bezier 
            style={{ borderRadius: 12 }} 
          />
        </View>

        {/* Data Table */}
        <View style={styles.tableCard}>
          <ScrollView horizontal>
            <View>
              <View style={styles.colHeaderRow}>
                {config.showColumns.map(col => (
                  <Text key={col} style={[styles.headerCell, { width: config.widths[col] }]}>{col.toUpperCase()}</Text>
                ))}
                <Text style={[styles.headerCell, { width: 120 }]}>ACTIONS</Text>
              </View>

              {loading && !refreshing ? (
                <ActivityIndicator size="large" color="#6200ee" style={{ margin: 40 }} />
              ) : filteredData.map(item => (
                <View key={item.id} style={styles.dataRow}>
                  {config.showColumns.map(col => (
                    <Text key={col} style={[styles.dataCell, { width: config.widths[col] }]} numberOfLines={1}>
                      {String(item[col] ?? '—')}
                    </Text>
                  ))}
                  <View style={[styles.actionCell, { width: 120 }]}>
                    <TouchableOpacity onPress={() => {setEditingId(item.id); setFormData({username: item.username, email: item.email, phone_number: item.phone_number ? String(item.phone_number): '', full_name: item.full_name}); setModalVisible(true)}}>
                      <Text style={styles.editBtn}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => confirmDelete(item.id)}>
                      <Text style={styles.deleteBtn}>Del</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </ScrollView>

      {/* Reusable Modal */}
      <Modal visible={isModalVisible} animationType="slide" transparent>
        <View style={modalStyles.overlay}>
          <View style={modalStyles.content}>
            <Text style={modalStyles.title}>{editingId ? 'Update Record' : 'Create Record'}</Text>
             <TextInput 
               style={styles.input} 
               placeholder="Full Name" 
               value={formData.full_name} 
               onChangeText={t => setFormData({...formData, full_name: t})} 
               placeholderTextColor="#666" 
            />
            <TextInput 
               style={styles.input} 
               placeholder="Username" 
               value={formData.username} 
               onChangeText={t => setFormData({...formData, username: t})} 
               placeholderTextColor="#666" 
            />
            <TextInput 
               style={styles.input} 
               placeholder="Email" 
               value={formData.email} 
               onChangeText={t => setFormData({...formData, email: t})} 
               placeholderTextColor="#666" 
               keyboardType="email-address"
            />
             <TextInput 
               style={styles.input} 
               placeholder="Phone Number" 
               value={formData.phone_number} 
               onChangeText={t => setFormData({...formData, phone_number: t})} 
               placeholderTextColor="#666" 
               keyboardType="numeric"
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={{ padding: 10, marginRight: 15 }}>
                <Text style={{ color: '#aaa' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} style={styles.addButton}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>{loading ? 'Saving...' : 'Confirm'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// some minor chart configuration
const chartConfig = {
  backgroundGradientFrom: "#16161d",
  backgroundGradientTo: "#1f1f27",
  color: (opacity = 1) => `rgba(98, 0, 238, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  propsForDots: { r: "4", strokeWidth: "2", stroke: "#6200ee" }
};

// simple modal styles
const modalStyles = StyleSheet.create({
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
  }
});