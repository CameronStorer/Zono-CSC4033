import React, { useState } from 'react';
import { Alert, Text, View, StyleSheet, Platform, TextInput, Image, TouchableOpacity, ActivityIndicator, Modal } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase, supabaseAdmin } from '@/components/supabase';
import { useAppTheme } from '@/contexts/theme-context';

const EMPTY_FORM = { full_name: '', username: '', email: '', password: '', confirmPassword: '' };

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { colors: C } = useAppTheme();

  const [signUpVisible, setSignUpVisible] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [signUpLoading, setSignUpLoading] = useState(false);

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

  async function handleSignUp() {
    const { full_name, username, email: newEmail, password: newPassword, confirmPassword } = form;

    if (!username || !newEmail || !newPassword) {
      return Alert.alert("Required", "Username, email, and password are required.");
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return Alert.alert("Validation Error", "Username must be alphanumeric (underscores allowed).");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      return Alert.alert("Validation Error", "Please enter a valid email address.");
    }
    if (newPassword.length < 6) {
      return Alert.alert("Validation Error", "Password must be at least 6 characters.");
    }
    if (newPassword !== confirmPassword) {
      return Alert.alert("Validation Error", "Passwords do not match.");
    }

    setSignUpLoading(true);
    try {
      const { error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: newEmail,
        password: newPassword,
        email_confirm: true,
        user_metadata: { full_name, username },
      });
      if (createError) throw createError;

      // Auto sign-in after account creation
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: newEmail,
        password: newPassword,
      });
      if (signInError) throw signInError;

      setSignUpVisible(false);
      setForm(EMPTY_FORM);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setSignUpLoading(false);
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

            <TouchableOpacity
              onPress={() => { setForm(EMPTY_FORM); setSignUpVisible(true); }}
              style={{ marginTop: 12, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#007AFF' }}
            >
              <Text style={{ color: '#007AFF', textAlign: 'center', fontWeight: '600' }}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <Modal visible={signUpVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: C.bgElement, borderColor: C.borderMuted }]}>
            <Text style={[styles.modalTitle, { color: C.text }]}>Create Account</Text>

            <TextInput
              style={[styles.modalInput, { backgroundColor: C.bgInput, color: C.text, borderColor: C.borderMuted }]}
              placeholder="Full Name"
              placeholderTextColor={C.textPlaceholder}
              value={form.full_name}
              onChangeText={t => setForm({ ...form, full_name: t })}
            />
            <TextInput
              style={[styles.modalInput, { backgroundColor: C.bgInput, color: C.text, borderColor: C.borderMuted }]}
              placeholder="Username"
              placeholderTextColor={C.textPlaceholder}
              autoCapitalize="none"
              value={form.username}
              onChangeText={t => setForm({ ...form, username: t })}
            />
            <TextInput
              style={[styles.modalInput, { backgroundColor: C.bgInput, color: C.text, borderColor: C.borderMuted }]}
              placeholder="Email"
              placeholderTextColor={C.textPlaceholder}
              autoCapitalize="none"
              keyboardType="email-address"
              value={form.email}
              onChangeText={t => setForm({ ...form, email: t })}
            />
            <TextInput
              style={[styles.modalInput, { backgroundColor: C.bgInput, color: C.text, borderColor: C.borderMuted }]}
              placeholder="Password"
              placeholderTextColor={C.textPlaceholder}
              secureTextEntry
              value={form.password}
              onChangeText={t => setForm({ ...form, password: t })}
            />
            <TextInput
              style={[styles.modalInput, { backgroundColor: C.bgInput, color: C.text, borderColor: C.borderMuted }]}
              placeholder="Confirm Password"
              placeholderTextColor={C.textPlaceholder}
              secureTextEntry
              value={form.confirmPassword}
              onChangeText={t => setForm({ ...form, confirmPassword: t })}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setSignUpVisible(false)}
                style={[styles.modalBtn, { backgroundColor: C.bgElevated }]}
              >
                <Text style={{ color: C.textSecondary, fontWeight: '500' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSignUp}
                disabled={signUpLoading}
                style={[styles.modalBtn, { backgroundColor: '#007AFF' }]}
              >
                {signUpLoading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={{ color: '#fff', fontWeight: '600' }}>Create & Sign In</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    height: 500,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  loginText: { fontSize: 28, fontWeight: "bold", fontFamily: "monospace", textAlign: "center", width: "60%", marginBottom: 20 },
  input: { fontFamily: "monospace", height: 45, width: 250, margin: 20, borderWidth: 2, paddingHorizontal: 10 },
  googleButton: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16, marginTop: 12, gap: 10 },
  googleIcon: { width: 20, height: 20 },
  googleText: { fontSize: 14, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '88%', borderRadius: 16, padding: 24, borderWidth: 1 },
  modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
  modalInput: { padding: 12, borderRadius: 8, borderWidth: 1, fontSize: 15, marginBottom: 10 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  modalBtn: { flex: 1, borderRadius: 8, paddingVertical: 13, alignItems: 'center' },
});
