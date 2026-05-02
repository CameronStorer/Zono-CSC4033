import React, { useState } from 'react';
import { Alert, Text, View, StyleSheet, Platform, TextInput, Image, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/components/supabase';
import { useAppTheme } from '@/contexts/theme-context';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { colors: C } = useAppTheme();

  async function handleLogin() {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) Alert.alert("Login error", error.message);
    } catch (e) {
      if (e instanceof Error) Alert.alert("Unexpected Error", e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.loginHeaderBg, paddingTop: Platform.OS === 'web' ? 80 : 0 }} edges={['top']}>
      <View style={styles.screen}>
        <View style={[styles.top, { backgroundColor: C.loginHeaderBg }]}>
          <Text style={styles.text}>Z O N O</Text>
        </View>
        <View style={[styles.bottom, { backgroundColor: C.loginAccentBg }]} />
        <View style={styles.centerLoginBox}>
          <View style={[styles.loginBox, { backgroundColor: C.loginBoxBg, shadowColor: C.loginBoxShadow }]}>
            <Text style={[styles.loginText, { color: C.loginTitleText }]}>Welcome to ZONO, Log In!</Text>

            <TextInput
              style={[styles.input, { borderColor: C.loginInputBorder, backgroundColor: C.loginInputBg, color: C.text }]}
              placeholder="EMAIL"
              placeholderTextColor="#c0c0c0"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={[styles.input, { borderColor: C.loginInputBorder, backgroundColor: C.loginInputBg, color: C.text }]}
              placeholder="PASSWORD"
              placeholderTextColor="#c0c0c0"
              secureTextEntry
              autoCapitalize="none"
              value={password}
              onChangeText={setPassword}
            />

            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              style={{ backgroundColor: loading ? '#ccc' : '#007AFF', padding: 15, borderRadius: 8 }}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={{ color: '#fff', textAlign: 'center' }}>Sign In</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity style={[styles.googleButton, { backgroundColor: C.loginBoxBg, borderColor: C.borderMuted }]} onPress={() => {}}>
              <Image source={{ uri: 'https://www.google.com/favicon.ico' }} style={styles.googleIcon} />
              <Text style={[styles.googleText, { color: C.textSecondary }]}>Login with Google</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  top: { flex: 0.08, justifyContent: "flex-start", alignItems: "center" },
  bottom: { flex: 0.92 },
  text: { fontSize: 50, fontWeight: "bold", fontFamily: "monospace", color: "#ffff" },
  centerLoginBox: { position: "absolute", top: 50, right: 0, bottom: 0, left: 0, justifyContent: "center", alignItems: "center" },
  loginBox: {
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    width: 450,
    height: 450,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  loginText: { fontSize: 28, fontWeight: "bold", fontFamily: "monospace", textAlign: "center", width: "60%", marginBottom: 20 },
  input: { fontFamily: "monospace", height: 45, width: 250, margin: 20, borderWidth: 2, paddingHorizontal: 10 },
  googleButton: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16, marginTop: 12, gap: 10 },
  googleIcon: { width: 20, height: 20 },
  googleText: { fontSize: 14, fontWeight: '600' },
});
