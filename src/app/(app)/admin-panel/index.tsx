import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, ScrollView, ActivityIndicator, TouchableOpacity,
  Alert, Dimensions, Modal, TextInput, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-chart-kit';
import { DATABASE_CONFIG, fetchTableData, deleteRow } from '@/app/(app)/admin-panel/_logic';
import { makeStyles } from '@/app/(app)/admin-panel/_style';
import { supabase, supabaseAdmin } from '@/components/supabase';
import { useAppTheme } from '@/contexts/theme-context';
import { SlideScreen } from '@/components/slide-screen';

// admin panel page
export default function AdminPanel() {
  const { colors: C, resolved } = useAppTheme();
  const styles = useMemo(() => makeStyles(C), [resolved]);
  const chartConfig = useMemo(() => ({
    backgroundGradientFrom: C.chartFrom,
    backgroundGradientTo: C.chartTo,
    color: (opacity = 1) => `rgba(98, 0, 238, ${opacity})`,
    labelColor: (opacity = 1) => resolved === 'dark' ? `rgba(255,255,255,${opacity})` : `rgba(51,51,51,${opacity})`,
    propsForDots: { r: "4", strokeWidth: "2", stroke: "#6200ee" },
  }), [resolved]);

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State
  const [isModalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const config = DATABASE_CONFIG.users;
  const screenWidth = Dimensions.get("window").width;


  const [formData, setFormData] = useState({
    username: '', email: '', phone_number: '', 
    full_name: '', password: '', confirmPassword: ''
  });



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
  const confirmDelete = (id: string, uid: string) => {
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
              setLoading(true);
              await deleteRow(config.table, id, uid);
              await loadData();
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
// At the top of your component, add password to formData:
  const handleSave = async () => {
    const { username, email, phone_number, full_name, password, confirmPassword } = formData;

    // ── Validation ─────────────────────────────────────────
    const unRegex    = /^[a-zA-Z0-9_]+$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?[0-9]{7,15}$/;
    const nameRegex  = /^[a-zA-ZÀ-ÿ' \-\.]+$/;

    if (!username || !email) {
      return Alert.alert("Required", "Username and email are mandatory.");
    }
    if (!unRegex.test(username)) {
      return Alert.alert("Validation Error", "Username must be alphanumeric (underscores allowed).");
    }
    if (!emailRegex.test(email)) {
      return Alert.alert("Validation Error", "Please enter a valid email address.");
    }
    if (phone_number && !phoneRegex.test(phone_number)) {
      return Alert.alert("Validation Error", "Phone number must be 7–15 digits.");
    }
    if (full_name && !nameRegex.test(full_name)) {
      return Alert.alert("Validation Error", "Name can only contain letters, spaces, hyphens.");
    }

    // Password validation only on new user creation
    if (!editingId) {
      if (!password) {
        return Alert.alert("Required", "Password is required.");
      }
      if (password.length < 6) {
        return Alert.alert("Validation Error", "Password must be at least 6 characters.");
      }
      if (password !== confirmPassword) {
        return Alert.alert("Validation Error", "Passwords do not match.");
      }
    }

    setLoading(true);

    try {
      if (editingId) {
        const { error } = await supabaseAdmin
          .from(config.table)
          .update({ username, email, phone_number: phone_number || null, full_name })
          .eq('id', editingId);
        if (error) throw error;

      } else {
        // INSERT: admin creates user — no session change, no confirmation email
        const { error: authError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name, username },
        });

        if (authError) throw authError;
      }

      setModalVisible(false);
      setEditingId(null);
      setFormData({ username: '', email: '', phone_number: '', full_name: '', password: '', confirmPassword: '' });
      setTimeout(() => loadData(), 500);

    } catch (e) {
      const error = e as Error;
      Alert.alert("Error", error.message);
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
    <SlideScreen index={4}>
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6200ee" />}
      >
        <View style={styles.headerActionRow}>
          <View>
            <Text style={styles.pageTitle}>{config.label}</Text>
            <Text style={{ color: C.textMuted }}>{data.length} Total Records</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={() => {setEditingId(null); setFormData({username:'', email:'', phone_number:'', full_name:'', password:'', confirmPassword:''}); setModalVisible(true)}}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>+ New User</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <TextInput
          style={[styles.input, { marginBottom: 20 }]}
          placeholder="Search by name or email..."
          placeholderTextColor={C.textPlaceholder}
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
                    <TouchableOpacity onPress={() => {
                      setEditingId(item.id);
                      setFormData({
                        username: item.username,
                        email: item.email,
                        phone_number: item.phone_number ? String(item.phone_number) : '',
                        full_name: item.full_name,
                        password: '',         // never prefill password on edit
                        confirmPassword: ''   // never prefill password on edit
                      });
                      setModalVisible(true);
                    }}>                      
                    <Text style={styles.editBtn}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => confirmDelete(item.id, item.uid)}>
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
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingId ? 'Update Record' : 'Create Record'}</Text>
             <TextInput 
               style={styles.input} 
               placeholder="Full Name" 
               value={formData.full_name} 
               onChangeText={t => setFormData({...formData, full_name: t})} 
               placeholderTextColor={C.textPlaceholder}
            />
            <TextInput 
               style={styles.input} 
               placeholder="Username" 
               value={formData.username} 
               onChangeText={t => setFormData({...formData, username: t})} 
               placeholderTextColor={C.textPlaceholder}
            />
            <TextInput 
               style={styles.input} 
               placeholder="Email" 
               value={formData.email} 
               onChangeText={t => setFormData({...formData, email: t})} 
               placeholderTextColor={C.textPlaceholder}
               keyboardType="email-address"
            />
            {!editingId && <>
              <TextInput
                style={styles.input}
                placeholder="Password"
                value={formData.password}
                onChangeText={t => setFormData({...formData, password: t})}
                placeholderTextColor={C.textPlaceholder}
                secureTextEntry
              />
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChangeText={t => setFormData({...formData, confirmPassword: t})}
                placeholderTextColor={C.textPlaceholder}
                secureTextEntry
              />
            </>}
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
    </SlideScreen>
  );
}

