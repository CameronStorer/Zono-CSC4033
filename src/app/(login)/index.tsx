/*////////////////////////////////////////////////////////////////////////
LOGIN PAGE
  - Option for user to login with Zono account
  - Or login with their Google account
*/////////////////////////////////////////////////////////////////////////

// necessary imports
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Text, View, StyleSheet, Platform, TextInput, Image, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/components/supabase';
import { useAuth } from '@/components/auth-context'

// page layout

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });

      if (error) {
        Alert.alert("Login error", error.message);
      }
      // If successful, the RouteGuard in your (login)/_layout 
      // will detect the session and redirect automatically.
    } catch (e) {
      if (e instanceof Error) {
        Alert.alert("Unexpected Error", e.message);
      }
    } finally {
      setLoading(false);
    }
  }
  return (
    // code to ensure that the page content doesn't fall under the nav bar
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: '#898989',
        paddingTop: Platform.OS === 'web' ? 80 : 0
      }}
      edges={['top']}
    >
      <View style={styles.screen}>
        <View style={styles.top}>
          <Text style={styles.text}>Z O N O</Text>
        </View>

        <View style={styles.bottom} />

        <View style={styles.centerLoginBox}>
          <View style={styles.loginBox}>
            <Text style={styles.loginText}>Welcome to ZONO, Log In!</Text>

            <TextInput
              style={styles.input}
              placeholder="EMAIL"
              placeholderTextColor="#c0c0c0"
              autoCapitalize="none" // makes the email not capitalize email
              value={email}
              onChangeText={setEmail}
            />

            <TextInput
              style={styles.input}
              placeholder="PASSWORD"
              placeholderTextColor="#c0c0c0"
              secureTextEntry // hides the password text
              autoCapitalize="none"
              value={password}
              onChangeText={setPassword}
            />


          <TouchableOpacity 
                onPress={handleLogin} // This is the crucial link
                disabled={loading}
                style={{ 
                  backgroundColor: loading ? '#ccc' : '#007AFF', 
                  padding: 15, 
                  borderRadius: 8 
                }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: '#fff', textAlign: 'center' }}>Sign In</Text>
                )}
              </TouchableOpacity>


            <TouchableOpacity 
              style={styles.googleButton} 
              onPress={() => {}}>

              <Image
                source={{ uri: 'https://www.google.com/favicon.ico' }}
                style={styles.googleIcon}
              />
              <Text style={styles.googleText}>Login with Google</Text>
            </TouchableOpacity>


          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

// styling
const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  top: { // gray at top
    flex: 0.08, // 0.08/1 of the screen
    justifyContent: "flex-start", // vertical placement of Z O N O
    alignItems: "center", // horizontal placement Z O N O
    backgroundColor: '#898989',
  },
  bottom: { // blue background
    flex: 0.92, // 0.92/1 of the screen
    backgroundColor: "#1fa3fc"
  },
  text: { // wording of Z O N O
    fontSize: 50,
    fontWeight: "bold",
    fontFamily: "monospace",
    color: "#ffff",
  },
  centerLoginBox: { // keep white login box center
    position: "absolute",
    top: 50,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: "center",
    alignItems: "center",
    // zIndex: 10, // for layering, keeps everything in the login box in front
  },
  loginBox: { // white login box
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    width: 450,
    height: 450,
    backgroundColor: "white",
    borderRadius: 30, // curveyness of white box
    justifyContent: "center",
    alignItems: "center",
  },
  loginText: { // "Welcome to ZONO, Log In!"
    fontSize: 28,
    fontWeight: "bold",
    color: "#898989",
    fontFamily: "monospace",
    textAlign: "center",
    width: "60%", // the width the words spread out
    marginBottom: 20, // adds a little more space under the welcome words
  },
  input: { // input boxes
    fontFamily: "monospace",
    height: 45,
    width: 250,
    margin: 20,
    borderWidth: 2,
    borderColor: "#898989",
    paddingHorizontal: 10,
  },
  loginButton: { // regular login button
    backgroundColor: '#1fa3fc',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 45,
    marginTop: 10,
  },
  loginButtonText: { // wording inside login button
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  googleButton: { // google login button
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 12,
    gap: 10,
  },
  googleIcon: { // google icon size
    width: 20,
    height: 20,
  },
  googleText: {
    color: '#444',
    fontSize: 14,
    fontWeight: '600',
  },
});

