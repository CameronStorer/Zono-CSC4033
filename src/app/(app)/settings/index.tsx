import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, Text, ScrollView, ActivityIndicator, TouchableOpacity,  Pressable,
  Alert, Dimensions, Modal, TextInput, RefreshControl, StyleSheet, Animated, Button
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart,  } from 'react-native-chart-kit';
import { DATABASE_CONFIG, upsertRow } from '@/app/(app)/settings/_logic';
import { styles } from '@/app/(app)/settings/_style'; // Use your external styles
import { supabase } from '@/components/supabase';
import { useAuth } from '@/components/auth-context'
import { useRouter } from 'expo-router';

// admin panel page
export default function Settings() {

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
  const [isOn, setIsOn] = useState(false);
  const { profile, role, signOut } = useAuth()


  // Inside your component:
  const router = useRouter();

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      Alert.alert("Error", error.message);
    } else {
      // This forces the app to move back to the login screen
      router.replace('/(login)'); 
    }
  }

  // Logic: Filter data based on search
  const filteredData = useMemo(() => {
    return data.filter(item => 
      item.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [data, searchQuery]);


  // admin panel page structure
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a0f' }}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerActionRow}>

          <View>
            <Text style={styles.pageTitle}>{config.label}</Text>
          </View>

        </View>


        {/* example button */}
        <View style={styles.container}>
          <Text style = {{ color: 'white' }}>Name: {profile?.full_name}</Text>
          <Text style = {{ color: 'white' }}>Username: {profile?.username}</Text>
          {role === 'admin' && <Text style = {{ color: 'white' }}>You are an admin.</Text>}

          <Pressable
            onPress={signOut}
            // This function allows us to change style based on the 'pressed' state
            style={({ pressed }) => [
              {
                backgroundColor: pressed ? '#004080' : '#007AFF',
                transform: [{ scale: pressed ? 0.96 : 1.0 }] // Shrinks slightly when pressed
              },
              styles.button,]}>

            <Text style={styles.buttonText}>Sign Out</Text>
          </Pressable>
        </View>




      <View style={styles.container}>
      <Text style={[styles.statusText, { color: '#FFFFFF' }]}>
        {isOn ? "Switch is ON" : "Switch is OFF"}
      </Text>
      {/* The Pressable acts as the interactive area */}
      <Pressable
        onPress={() => setIsOn(!isOn)}
        style={({ pressed }) => [
          styles.switchTrack,
          // 1. Change track color based on state (ON/OFF)
          { backgroundColor: isOn ? '#4CD964' : '#E5E5EA' },
          // 2. Add a "shrink" effect when the user taps it
          { transform: [{ scale: pressed ? 0.95 : 1 }] }
        ]}

      >
        {/* The Thumb (The moving circle) */}
        <View
          style={[
            styles.thumb,
            // 3. Move the thumb left or right based on state
            { transform: [{ 
              translateX: isOn ? 24 : 0 }] }
          ]}
        />
      </Pressable>
    </View>



        {/* Data Table */}
        <View style={styles.tableCard}>
          <Text style={{ color: '#666' }} > test </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
