import {
  GoogleSignin,
  isSuccessResponse,
} from '@react-native-google-signin/google-signin';
import { useRouter } from 'expo-router';
import {
  GoogleAuthProvider,
  User,
  signInWithCredential,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { WEB_CLIENT_ID, auth } from '../firebase';
import { Session, getSession, isSessionActive, saveSession } from '../storage';

GoogleSignin.configure({ webClientId: WEB_CLIENT_ID });

function pesanError(e: any): string {
  switch (e?.code) {
    case 'auth/invalid-email':
      return 'Format email tidak valid';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email atau password salah';
    case 'auth/too-many-requests':
      return 'Terlalu banyak percobaan, coba lagi nanti';
    case 'auth/network-request-failed':
      return 'Tidak ada koneksi internet';
    case 'auth/operation-not-allowed':
      return 'Metode Email/Password belum diaktifkan di Firebase';
    default:
      return e?.message ?? 'Terjadi kesalahan';
  }
}

export default function Index() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const saved = await getSession();
      if (isSessionActive(saved)) {
        console.log('[BYPASS] token aktif ->', saved?.email, '-> langsung ke Home');
        router.replace('/home');
        return;
      }
      console.log('[BYPASS] tidak ada token aktif -> tampil halaman login');
      setChecking(false);
    })();
  }, []);

  const finishLogin = async (user: User, method: string) => {
    const token = await user.getIdToken();
    const fallbackName = user.email ? user.email.split('@')[0] : '';
    const newSession: Session = {
      token,
      uid: user.uid,
      name: user.displayName ?? fallbackName,
      email: user.email ?? '',
      method,
      savedAt: Date.now(),
    };
    await saveSession(newSession);
    console.log('[LOGIN] AFTER', method, '->', newSession.email, 'UID', newSession.uid);
    router.replace('/home');
  };

  const handleEmailLogin = async () => {
    setError(null);

    if (!email.trim() || !password) {
      setError('Isi email dan password');
      return;
    }

    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email.trim(), password);
      await finishLogin(result.user, 'password');
    } catch (e: any) {
      console.error('[LOGIN] gagal (email):', e?.code ?? e);
      setError(pesanError(e));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();

      if (!isSuccessResponse(response)) {
        setError('Login Google dibatalkan');
        return;
      }

      const idToken = response.data.idToken;
      if (!idToken) {
        setError('Token Google tidak ditemukan');
        return;
      }

      const credential = GoogleAuthProvider.credential(idToken);
      const result = await signInWithCredential(auth, credential);
      await finishLogin(result.user, 'google.com');
    } catch (e: any) {
      console.error('[LOGIN] gagal (google):', e?.code ?? e);
      setError(pesanError(e));
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>TF</Text>
          </View>
          <Text style={styles.title}>Selamat Datang</Text>
          <Text style={styles.subtitle}>Masuk untuk melihat data mahasiswa</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Masukkan email"
            placeholderTextColor={COLORS.placeholder}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Masukkan password"
            placeholderTextColor={COLORS.placeholder}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.disabled]}
            onPress={handleEmailLogin}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryText}>Login</Text>
            )}
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>atau</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={[styles.googleButton, loading && styles.disabled]}
            onPress={handleGoogle}
            disabled={loading}>
            <View style={styles.googleBadge}>
              <Text style={styles.googleBadgeText}>G</Text>
            </View>
            <Text style={styles.googleText}>Login with Google</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const COLORS = {
  primary: '#2F5BEA',
  background: '#F4F6FB',
  card: '#FFFFFF',
  text: '#1B2230',
  muted: '#6B7385',
  border: '#DDE2EE',
  placeholder: '#A3AABB',
  danger: '#C62828',
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 24 },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  title: { fontSize: 26, fontWeight: 'bold', color: COLORS.text },
  subtitle: { fontSize: 14, color: COLORS.muted, marginTop: 6, textAlign: 'center' },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
    marginBottom: 14,
    backgroundColor: '#FAFBFE',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  disabled: { opacity: 0.6 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 18 },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { marginHorizontal: 12, color: COLORS.muted, fontSize: 13 },
  error: {
    color: COLORS.danger,
    fontSize: 13,
    marginBottom: 12,
    backgroundColor: '#FDECEC',
    padding: 10,
    borderRadius: 8,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  googleBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EA4335',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  googleBadgeText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  googleText: { fontSize: 15, fontWeight: '600', color: COLORS.text },
});