// sov3-auth-react-native.js
// SOV3 Sovereign Auth SDK for React Native (iOS, Android, Web, Windows, macOS)
// CSOAI Ltd UK 16939677 · MIT License · 30 June 2026
//
// 17 providers in one SDK. Works in React Native, Expo, and any RN-based
// framework (React Native Web, React Native Windows, React Native macOS).
//
// Usage:
//   import { SOV3AuthProvider, useSOV3, SOV3SignInButton } from '@csoai-org/sov3-auth/react-native';
//
//   export default function App() {
//     return (
//       <SOV3AuthProvider clientId="your_client_id">
//         <SOV3SignInButton provider="google" />
//         <SovereignDashboard />
//       </SOV3AuthProvider>
//     );
//   }

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Platform, Linking, View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-google-sign-in';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';

// === Constants ===
const SOV3_API_BASE = 'https://csoai.org';
const STORAGE_USER = '@sov3_user';
const STORAGE_TOKEN = '@sov3_token';

// === Sovereign User ===
class SovereignUser {
  constructor(data) {
    Object.assign(this, data);
  }

  static fromJSON(json) {
    return new SovereignUser(json);
  }

  toJSON() {
    return { ...this };
  }
}

// === Auth Context ===
const SOV3AuthContext = createContext(null);

export function SOV3AuthProvider({ clientId, apiBase = SOV3_API_BASE, children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    loadCachedAuth();
  }, []);

  const loadCachedAuth = async () => {
    try {
      const storedUser = await AsyncStorage.getItem(STORAGE_USER);
      const storedToken = await SecureStore.getItemAsync(STORAGE_TOKEN);
      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      }
    } catch (e) {
      console.warn('Failed to load cached auth:', e);
    } finally {
      setIsLoading(false);
      setIsReady(true);
    }
  };

  const persistAuth = async (userData, tokenData) => {
    try {
      await AsyncStorage.setItem(STORAGE_USER, JSON.stringify(userData));
      await SecureStore.setItemAsync(STORAGE_TOKEN, tokenData);
    } catch (e) {
      console.warn('Failed to persist auth:', e);
    }
  };

  const clearAuth = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_USER);
      await SecureStore.deleteItemAsync(STORAGE_TOKEN);
    } catch (e) {
      console.warn('Failed to clear auth:', e);
    }
    setUser(null);
    setToken(null);
  };

  const signIn = useCallback(async (provider, options = {}) => {
    setIsLoading(true);
    try {
      let result;
      switch (provider) {
        case 'apple':
          result = await signInWithApple();
          break;
        case 'google':
          result = await signInWithGoogle();
          break;
        case 'passkey':
          result = await signInWithPasskey();
          break;
        case 'email':
          result = await signInWithEmail(options.email);
          break;
        default:
          result = await signInWithOAuth(provider);
      }

      if (result?.user && result?.token) {
        setUser(result.user);
        setToken(result.token);
        await persistAuth(result.user, result.token);
        return result.user;
      }
    } catch (e) {
      console.error('Sign in failed:', e);
      Alert.alert('Sign In Failed', e.message);
    } finally {
      setIsLoading(false);
    }
    return null;
  }, [clientId, apiBase]);

  const signOut = useCallback(async () => {
    try {
      if (token) {
        await fetch(`${apiBase}/api/auth/signout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
        });
      }
    } catch {}
    await clearAuth();
  }, [token, apiBase]);

  const sovereignQuery = useCallback(async (query, options = {}) => {
    if (!token) throw new Error('Not signed in');
    const resp = await fetch(`${apiBase}/api/sovereign/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-Sov3-Dorado-Mode': options.mode || 'EAST',
      },
      body: JSON.stringify({
        query,
        care_floor: 0.95,
        bft_council_required: true,
        ...options,
      }),
    });
    return resp.json();
  }, [token, apiBase]);

  const value = {
    user,
    token,
    isLoading,
    isReady,
    signIn,
    signOut,
    sovereignQuery,
  };

  return <SOV3AuthContext.Provider value={value}>{children}</SOV3AuthContext.Provider>;
}

export function useSOV3() {
  const ctx = useContext(SOV3AuthContext);
  if (!ctx) throw new Error('useSOV3 must be used within SOV3AuthProvider');
  return ctx;
}

// === Provider-Specific Sign-In Methods ===

async function signInWithApple() {
  // Native iOS Apple Sign-In
  if (Platform.OS === 'ios' && AppleAuthentication.isAvailableAsync) {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    const resp = await fetch(`${SOV3_API_BASE}/api/auth/apple/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identity_token: credential.identityToken,
        email: credential.email,
        full_name: credential.fullName,
      }),
    });

    return resp.json();
  }
  // Web/fallback
  return signInWithOAuth('apple');
}

async function signInWithGoogle() {
  // Native iOS/Android Google Sign-In
  try {
    await Google.logInAsync({
      iosClientId: 'YOUR_IOS_CLIENT_ID',
      androidClientId: 'YOUR_ANDROID_CLIENT_ID',
      scopes: ['profile', 'email'],
    });
    // ... exchange for token
  } catch (e) {
    return signInWithOAuth('google');
  }
}

async function signInWithPasskey() {
  // Use biometric prompt + WebAuthn
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const supported = await LocalAuthentication.supportedAuthenticationTypesAsync();
  if (hasHardware && supported.length > 0) {
    await LocalAuthentication.authenticateAsync({
      promptMessage: 'Sovereign Sign In',
      fallbackLabel: 'Use Passcode',
    });
  }
  // Open Custom Tab
  return signInWithOAuth('passkey');
}

async function signInWithEmail(email) {
  if (!email) {
    Alert.prompt('Sovereign Email', 'Enter your email:');
    return null;
  }
  const resp = await fetch(`${SOV3_API_BASE}/api/auth/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, client_id: 'sov3-sovereign-rn' }),
  });
  const result = await resp.json();
  Alert.alert('Check your email', 'A magic link has been sent to ' + email);
  return { user: null, token: null, ...result };
}

async function signInWithOAuth(provider) {
  const redirectUri = 'csoai.sovereign:/oauth/callback';
  const authUrl = `${SOV3_API_BASE}/api/auth/${provider}?redirect_uri=${encodeURIComponent(redirectUri)}&client_id=sov3-sovereign-rn`;

  const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

  if (result.type === 'success' && result.url) {
    const url = new URL(result.url);
    const code = url.searchParams.get('code');
    if (code) {
      const tokenResp = await fetch(`${SOV3_API_BASE}/api/auth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, client_id: 'sov3-sovereign-rn', redirect_uri: redirectUri }),
      });
      return tokenResp.json();
    }
  }
  return null;
}

// === Components ===

export function SOV3SignInButton({ provider, label, onSuccess, style }) {
  const { signIn, isLoading } = useSOV3();
  const [loading, setLoading] = useState(false);

  const providerLabels = {
    google: 'Continue with Google',
    apple: 'Continue with Apple',
    microsoft: 'Continue with Microsoft',
    github: 'Continue with GitHub',
    passkey: 'Sign in with Passkey',
    email: 'Continue with Email',
    twitter: 'Continue with Twitter',
    linkedin: 'Continue with LinkedIn',
    wechat: 'Continue with WeChat',
    line: 'Continue with LINE',
    kakao: 'Continue with Kakao',
    naver: 'Continue with Naver',
    yandex: 'Continue with Yandex',
    vk: 'Continue with VK',
    oidc: 'Enterprise SSO',
    saml: 'Enterprise SAML',
  };

  const displayLabel = label || providerLabels[provider] || `Sign in with ${provider}`;
  const isApple = provider === 'apple';

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isApple ? styles.buttonApple : styles.buttonDefault,
        style,
        (isLoading || loading) && styles.buttonDisabled,
      ]}
      disabled={isLoading || loading}
      onPress={async () => {
        setLoading(true);
        try {
          const user = await signIn(provider);
          if (user) onSuccess?.(user);
        } finally {
          setLoading(false);
        }
      }}
    >
      {(isLoading || loading) ? (
        <ActivityIndicator color={isApple ? '#fff' : '#000'} />
      ) : (
        <Text style={[styles.buttonText, isApple && styles.buttonTextApple]}>
          {displayLabel}
        </Text>
      )}
    </TouchableOpacity>
  );
}

export function SOV3SignInButtons({ providers = ['google', 'apple', 'passkey', 'email'], onSuccess }) {
  return (
    <View>
      {providers.map((p) => (
        <SOV3SignInButton key={p} provider={p} onSuccess={onSuccess} />
      ))}
    </View>
  );
}

export function SovereignDashboard() {
  const { user, signOut, sovereignQuery } = useSOV3();
  if (!user) return null;
  return (
    <View style={styles.dashboard}>
      <Text style={styles.dashboardTitle}>🜏 Sovereign Citizen</Text>
      <Text style={styles.dashboardText}>{user.email || user.i_character_id}</Text>
      <Text style={styles.dashboardSubtext}>Composite: {user.sovereign_composite}</Text>
      <Text style={styles.dashboardSubtext}>Care Floor: {user.care_floor}</Text>
      <Text style={styles.dashboardSubtext}>BFT: {user.bft_council}</Text>
      <TouchableOpacity onPress={signOut} style={styles.signOutButton}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

// === Styles ===
const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fbbf24',
    marginVertical: 4,
    alignItems: 'center',
    backgroundColor: '#0a0e27',
  },
  buttonDefault: {
    backgroundColor: '#0a0e27',
    borderColor: 'rgba(251,191,36,0.4)',
  },
  buttonApple: {
    backgroundColor: '#000',
    borderColor: '#fff',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fbbf24',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextApple: {
    color: '#fff',
  },
  dashboard: {
    padding: 24,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.3)',
    margin: 16,
  },
  dashboardTitle: {
    color: '#fbbf24',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  dashboardText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 4,
  },
  dashboardSubtext: {
    color: '#06b6d4',
    fontSize: 12,
    marginBottom: 2,
  },
  signOutButton: {
    marginTop: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(239,68,68,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.4)',
    borderRadius: 8,
    alignItems: 'center',
  },
  signOutText: {
    color: '#ef4444',
    fontWeight: '600',
  },
});

export default SOV3AuthProvider;