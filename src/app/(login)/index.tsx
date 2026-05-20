import React, { useState, Suspense } from 'react';
import { Alert, Text, View, StyleSheet, Platform, TextInput, TouchableOpacity, ActivityIndicator, Modal, KeyboardAvoidingView, ScrollView } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase, supabaseAdmin } from '@/components/supabase';
import { useAppTheme } from '@/contexts/theme-context';
import { AsyncSkia } from '@/components/async-skia';
import { Image } from 'expo-image';

const EMPTY_FORM = { full_name: '', username: '', email: '', password: '', confirmPassword: '' };
const Iridescence = React.lazy(() => import('@/components/iridescence'));

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
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: C.loginHeaderBg,
        paddingTop: Platform.OS === 'web' ? 80 : 0
      }}
      edges={['top']}
      >

      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        <Suspense fallback={<ActivityIndicator />}>
          <AsyncSkia />
          <Iridescence color={[0.0, 0.7, 0.9]} />
        </Suspense>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo with shape-fitted contrast outline */}
          <View style={styles.logoWrapper}>

            <Image
              source={require('../../../assets/images/Zono Logo.svg')}
              style={[styles.logo, StyleSheet.absoluteFillObject]}
              contentFit="contain"
              tintColor="#ffffff"
            />
          </View>

          <View style={styles.loginBox}>
            <Text style={styles.loginText} adjustsFontSizeToFit numberOfLines={2} minimumFontScale={0.6}>
              Welcome, Log In!
            </Text>

            <TextInput
              style={styles.input}
              placeholder="EMAIL"
              placeholderTextColor="rgba(255,255,255,0.5)"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={styles.input}
              placeholder="PASSWORD"
              placeholderTextColor="rgba(255,255,255,0.5)"
              secureTextEntry
              autoCapitalize="none"
              value={password}
              onChangeText={setPassword}
            />

            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              style={[styles.signInBtn, loading && { backgroundColor: 'rgba(255,255,255,0.3)' }]}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.signInText} adjustsFontSizeToFit numberOfLines={1}>Sign In</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => { setForm(EMPTY_FORM); setSignUpVisible(true); }}
              style={styles.createBtn}
            >
              <Text style={styles.createText} adjustsFontSizeToFit numberOfLines={1}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
    gap: 32,
  },
  logoWrapper: {
    width: 280,
    height: 75,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  logo: { width: 280, height: 75 },
  loginBox: {
    width: 340,
    borderRadius: 28,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.38)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
  },
  loginText: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'monospace',
    textAlign: 'center',
    color: '#ffffff',
    marginBottom: 20,
    width: '85%',
  },
  input: {
    fontFamily: 'monospace',
    height: 46,
    width: '100%',
    marginVertical: 8,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 14,
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: '#ffffff',
  },
  signInBtn: {
    width: '100%',
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  signInText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  createBtn: {
    width: '100%',
    marginTop: 10,
    padding: 13,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
  },
  createText: { color: '#ffffff', fontWeight: '600', fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '88%', borderRadius: 16, padding: 24, borderWidth: 1 },
  modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
  modalInput: { padding: 12, borderRadius: 8, borderWidth: 1, fontSize: 15, marginBottom: 10 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  modalBtn: { flex: 1, borderRadius: 8, paddingVertical: 13, alignItems: 'center' },
});
