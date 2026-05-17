import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, ScrollView, ActivityIndicator, TouchableOpacity,
  Alert, Dimensions, Modal, TextInput, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-chart-kit';
import { DATABASE_CONFIG, fetchTableData, deleteRow } from './_logic';
import { makeStyles } from './_style';
import { supabase, supabaseAdmin } from '@/components/supabase';
import { useAppTheme } from '@/contexts/theme-context';
import { SlideScreen } from '@/components/slide-screen';
import Accordion from '@/components/accordion';

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

  const [usersData, setUsersData] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [reportsData, setReportsData] = useState<any[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const usersConfig = DATABASE_CONFIG.users;
  const reportsConfig = DATABASE_CONFIG.reports;
  const screenWidth = Dimensions.get("window").width;

  const [formData, setFormData] = useState({
    username: '', email: '', phone_number: '',
    full_name: '', password: '', confirmPassword: ''
  });

  // initial loading of users table data
  const loadUsersData = async () => {
    try {
      const result = await fetchTableData(usersConfig.table);
      setUsersData(result || []);
    } catch (e: any) {
      Alert.alert("Error loading users table data", e.message);
    } finally {
      setUsersLoading(false);
      setRefreshing(false);
    }
  };

  const loadReportsData = async () => {
    try {
      const result = await fetchTableData(reportsConfig.table);
      setReportsData(result || []);
    } catch (e: any) {
      Alert.alert("Error loading reports table data", e.message);
    } finally {
      setReportsLoading(false);
      setRefreshing(false);
    }
  };

  // load both tables on mount
  useEffect(() => { loadUsersData(); loadReportsData(); }, []);

  // on refresh reload both tables
  const onRefresh = () => {
    setRefreshing(true);
    loadUsersData();
    loadReportsData();
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
              setUsersLoading(true);
              await deleteRow(usersConfig.table, id, uid);
              await loadUsersData();
            } catch (e: any) {
              Alert.alert("Delete Failed", e.message);
            } finally {
              setUsersLoading(false);
            }
          }
        }
      ]
    );
  };

  // update report_status on a report row
  const handleReportAction = async (reportId: string, status: 'resolved' | 'dismissed') => {
    try {
      const { error } = await supabaseAdmin
        .from(reportsConfig.table)
        .update({ report_status: status })
        .eq('report_id', reportId);
      if (error) throw error;
      await loadReportsData();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  // Logic: Filter users data based on search
  const filteredData = useMemo(() => {
    return usersData.filter(item =>
      item.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [usersData, searchQuery]);

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

    setUsersLoading(true);

    try {
      if (editingId) {
        const { error } = await supabaseAdmin
          .from(usersConfig.table)
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
      setTimeout(() => loadUsersData(), 500);

    } catch (e) {
      const error = e as Error;
      Alert.alert("Error", error.message);
    } finally {
      setUsersLoading(false);
    }
  };

  // display user registrations as cumulative growth chart
  const getChartData = () => {
    if (usersData.length === 0) return { labels: ["None"], datasets: [{ data: [0] }] };

    const counts: { [key: string]: number } = {};
    usersData.forEach(user => {
      const date = new Date(user.created_at).toISOString().split('T')[0];
      counts[date] = (counts[date] || 0) + 1;
    });

    const sortedDates = Object.keys(counts).sort();

    let cumulative = 0;
    const cumulativeData = sortedDates.map(date => {
      cumulative += counts[date];
      return cumulative;
    });

    const labels = sortedDates.map(date => {
      const d = new Date(date);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    });

    return {
      labels: labels.slice(-6),
      datasets: [{ data: cumulativeData.slice(-6) }]
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
        {/* Users Section Header */}
        <View style={styles.headerActionRow}>
          <View>
            <Text style={styles.pageTitle}>{usersConfig.label}</Text>
            <Text style={{ color: C.textMuted }}>{usersData.length} Total Records</Text>
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
        <Accordion title={`${usersConfig.label} (${usersData.length})`} defaultOpen={true}>
          {/* Users Data Table */}
          <View style={styles.tableCard}>
            <ScrollView horizontal>
              <View>
                <View style={styles.colHeaderRow}>
                  {usersConfig.showColumns.map(col => (
                    <Text key={col} style={[styles.headerCell, { width: usersConfig.widths[col] }]}>{col.toUpperCase()}</Text>
                  ))}
                  <Text style={[styles.headerCell, { width: 120 }]}>ACTIONS</Text>
                </View>

                {usersLoading && !refreshing ? (
                  <ActivityIndicator size="large" color="#6200ee" style={{ margin: 40 }} />
                ) : filteredData.map(item => (
                  <View key={item.id} style={styles.dataRow}>
                    {usersConfig.showColumns.map(col => (
                      <Text key={col} style={[styles.dataCell, { width: usersConfig.widths[col] }]} numberOfLines={1}>
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
                          password: '',
                          confirmPassword: ''
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
        </Accordion>

        {/* Reports Section Header */}
        <View style={[styles.headerActionRow, { marginTop: 30 }]}>
          <View>
            <Text style={styles.pageTitle}>{reportsConfig.label}</Text>
            <Text style={{ color: C.textMuted }}>{reportsData.length} Total Records</Text>
          </View>
        </View>

        <Accordion title={`${reportsConfig.label} (${reportsData.length})`} defaultOpen={true}>
          {/* Reports Data Table */}
          <View style={styles.tableCard}>
            <ScrollView horizontal>
              <View>
                <View style={styles.colHeaderRow}>
                  {reportsConfig.showColumns.map(col => (
                    <Text key={col} style={[styles.headerCell, { width: reportsConfig.widths[col] ?? 120 }]}>
                      {col.toUpperCase()}
                    </Text>
                  ))}
                  <Text style={[styles.headerCell, { width: 160 }]}>ACTIONS</Text>
                </View>

                {reportsLoading && !refreshing ? (
                  <ActivityIndicator size="large" color="#6200ee" style={{ margin: 40 }} />
                ) : reportsData.map(item => (
                  <View key={item.report_id} style={styles.dataRow}>
                    {reportsConfig.showColumns.map(col => (
                      <Text key={col} style={[styles.dataCell, { width: reportsConfig.widths[col] ?? 120 }]} numberOfLines={1}>
                        {String(item[col] ?? '—')}
                      </Text>
                    ))}
                    <View style={[styles.actionCell, { width: 160 }]}>
                      <TouchableOpacity onPress={() => handleReportAction(item.report_id, 'resolved')}>
                        <Text style={styles.editBtn}>Resolve</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleReportAction(item.report_id, 'dismissed')}>
                        <Text style={styles.deleteBtn}>Dismiss</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </Accordion>
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
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>{usersLoading ? 'Saving...' : 'Confirm'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
    </SlideScreen>
  );
}
