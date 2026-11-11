// import {
//   GoogleSignin,
//   isSuccessResponse,
// } from '@react-native-google-signin/google-signin';
// import { useRouter } from 'expo-router';
// import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
// import React, { useEffect, useState } from 'react';
// import {
//   ActivityIndicator,
//   KeyboardAvoidingView,
//   Platform,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
// } from 'react-native';

// import { WEB_CLIENT_ID, auth } from '../firebase';
// import { Session, getSession, isSessionActive, saveSession } from '../storage';

// GoogleSignin.configure({ webClientId: WEB_CLIENT_ID });

// export default function Index() {
//   const router = useRouter();
//   const [checking, setChecking] = useState(true);
//   const [loading, setLoading] = useState(false);
//   const [username, setUsername] = useState('');
//   const [password, setPassword] = useState('');
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     (async () => {
//       const saved = await getSession();
//       if (isSessionActive(saved)) {
//         console.log('[BYPASS] token aktif ->', saved?.email, '-> langsung ke Home');
//         router.replace('/home');
//         return;
//       }
//       console.log('[BYPASS] tidak ada token aktif -> tampil halaman login');
//       setChecking(false);
//     })();
//   }, []);

//   const handleDummyLogin = () => {
//     console.log('[UI] tombol Login ditekan (dummy, tidak melakukan apa-apa)');
//   };

//   const handleGoogle = async () => {
//     setError(null);
//     setLoading(true);
//     try {
//       await GoogleSignin.hasPlayServices();
//       const response = await GoogleSignin.signIn();

//       if (!isSuccessResponse(response)) {
//         setError('Login Google dibatalkan');
//         return;
//       }

//       const idToken = response.data.idToken;
//       if (!idToken) {
//         setError('Token Google tidak ditemukan');
//         return;
//       }

//       const credential = GoogleAuthProvider.credential(idToken);
//       const result = await signInWithCredential(auth, credential);
//       const firebaseToken = await result.user.getIdToken();

//       const newSession: Session = {
//         token: firebaseToken,
//         name: result.user.displayName ?? '',
//         email: result.user.email ?? '',
//         savedAt: Date.now(),
//       };

//       await saveSession(newSession);
//       console.log('[LOGIN] AFTER (login berhasil) ->', newSession.email);
//       router.replace('/home');
//     } catch (e: any) {
//       console.error('[LOGIN] gagal:', e);
//       setError(e?.message ?? 'Login Google gagal');
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (checking) {
//     return (
//       <View style={styles.center}>
//         <ActivityIndicator size="large" color={COLORS.primary} />
//       </View>
//     );
//   }

//   return (
//     <KeyboardAvoidingView
//       style={styles.flex}
//       behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
//       <ScrollView
//         contentContainerStyle={styles.scroll}
//         keyboardShouldPersistTaps="handled">
//         <View style={styles.header}>
//           <Text style={styles.title}>Selamat Datang</Text>
//           <Text style={styles.subtitle}>Masuk untuk melihat data mahasiswa</Text>
//         </View>

//         <View style={styles.card}>
//           <Text style={styles.label}>Username</Text>
//           <TextInput
//             style={styles.input}
//             placeholder="Masukkan username"
//             placeholderTextColor={COLORS.placeholder}
//             value={username}
//             onChangeText={setUsername}
//             autoCapitalize="none"
//             autoCorrect={false}
//           />

//           <Text style={styles.label}>Password</Text>
//           <TextInput
//             style={styles.input}
//             placeholder="Masukkan password"
//             placeholderTextColor={COLORS.placeholder}
//             value={password}
//             onChangeText={setPassword}
//             secureTextEntry
//             autoCapitalize="none"
//           />

//           <TouchableOpacity style={styles.primaryButton} onPress={handleDummyLogin}>
//             <Text style={styles.primaryText}>Login</Text>
//           </TouchableOpacity>

//           <View style={styles.dividerRow}>
//             <View style={styles.dividerLine} />
//             <Text style={styles.dividerText}>atau</Text>
//             <View style={styles.dividerLine} />
//           </View>

//           {error && <Text style={styles.error}>{error}</Text>}

//           <TouchableOpacity
//             style={[styles.googleButton, loading && styles.disabled]}
//             onPress={handleGoogle}
//             disabled={loading}>
//             {loading ? (
//               <ActivityIndicator color={COLORS.primary} />
//             ) : (
//               <>
//                 <View style={styles.googleBadge}>
//                   <Text style={styles.googleBadgeText}>G</Text>
//                 </View>
//                 <Text style={styles.googleText}>Login with Google</Text>
//               </>
//             )}
//           </TouchableOpacity>
//         </View>
//       </ScrollView>
//     </KeyboardAvoidingView>
//   );
// }

// const COLORS = {
//   primary: '#2F5BEA',
//   background: '#F4F6FB',
//   card: '#FFFFFF',
//   text: '#1B2230',
//   muted: '#6B7385',
//   border: '#DDE2EE',
//   placeholder: '#A3AABB',
//   danger: '#C62828',
// };

// const styles = StyleSheet.create({
//   flex: { flex: 1, backgroundColor: COLORS.background },
//   center: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: COLORS.background,
//   },
//   scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
//   header: { alignItems: 'center', marginBottom: 24 },
//   logo: {
//     width: 64,
//     height: 64,
//     borderRadius: 18,
//     backgroundColor: COLORS.primary,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 16,
//   },
//   logoText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
//   title: { fontSize: 26, fontWeight: 'bold', color: COLORS.text },
//   subtitle: { fontSize: 14, color: COLORS.muted, marginTop: 6, textAlign: 'center' },
//   card: {
//     backgroundColor: COLORS.card,
//     borderRadius: 16,
//     padding: 20,
//     shadowColor: '#000',
//     shadowOpacity: 0.06,
//     shadowRadius: 12,
//     shadowOffset: { width: 0, height: 4 },
//     elevation: 3,
//   },
//   label: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
//   input: {
//     borderWidth: 1,
//     borderColor: COLORS.border,
//     borderRadius: 10,
//     paddingHorizontal: 14,
//     paddingVertical: 12,
//     fontSize: 15,
//     color: COLORS.text,
//     marginBottom: 14,
//     backgroundColor: '#FAFBFE',
//   },
//   primaryButton: {
//     backgroundColor: COLORS.primary,
//     borderRadius: 10,
//     paddingVertical: 14,
//     alignItems: 'center',
//   },
//   primaryText: { color: '#fff', fontSize: 16, fontWeight: '600' },
//   disabled: { opacity: 0.6 },
//   dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 18 },
//   dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
//   dividerText: { marginHorizontal: 12, color: COLORS.muted, fontSize: 13 },
//   error: {
//     color: COLORS.danger,
//     fontSize: 13,
//     marginBottom: 12,
//     backgroundColor: '#FDECEC',
//     padding: 10,
//     borderRadius: 8,
//   },
//   googleButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderWidth: 1,
//     borderColor: COLORS.border,
//     borderRadius: 10,
//     paddingVertical: 12,
//     backgroundColor: '#fff',
//   },
//   googleBadge: {
//     width: 24,
//     height: 24,
//     borderRadius: 12,
//     backgroundColor: '#EA4335',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: 10,
//   },
//   googleBadgeText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
//   googleText: { fontSize: 15, fontWeight: '600', color: COLORS.text },
// });

import {
  GoogleSignin,
  isSuccessResponse,
} from '@react-native-google-signin/google-signin';
import { useRouter } from 'expo-router';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
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

const FITUR = ['Google Auth', 'Data realtime', 'Sesi tersimpan'];

export default function Index() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(40)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    (async () => {
      const saved = await getSession();
      if (isSessionActive(saved)) {
        console.log('[Auth] sesi masih aktif, lanjut ke Home:', saved?.email);
        router.replace('/home');
        return;
      }
      console.log('[Auth] belum ada sesi aktif, tampilkan halaman login');
      setChecking(false);
    })();
  }, []);

  useEffect(() => {
    if (checking) return;

    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [checking]);

  const handleManualLogin = () => {
    console.log('[Auth] tombol Masuk manual ditekan (belum diaktifkan)');
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
      const firebaseToken = await result.user.getIdToken();

      const newSession: Session = {
        token: firebaseToken,
        name: result.user.displayName ?? '',
        email: result.user.email ?? '',
        savedAt: Date.now(),
      };

      await saveSession(newSession);
      console.log('[Auth] login Google sukses:', newSession.email);
      router.replace('/home');
    } catch (e: any) {
      console.error('[Auth] login Google gagal:', e);
      setError(e?.message ?? 'Login Google gagal');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#7C9CFF" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={[styles.blob, styles.blobBlue]} />
      <View style={[styles.blob, styles.blobPurple]} />
      <View style={[styles.blob, styles.blobPink]} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Animated.View
            style={[styles.hero, { opacity: fade, transform: [{ translateY: slide }] }]}>
            <Animated.View style={[styles.logo, { transform: [{ scale: pulse }] }]}>
              <Text style={styles.logoText}>DM</Text>
            </Animated.View>
            <Text style={styles.title}>Data Mahasiswa</Text>
            <Text style={styles.tagline}>
              Satu pintu untuk melihat seluruh data kampus, kapan saja.
            </Text>
            <View style={styles.pillRow}>
              {FITUR.map((f) => (
                <View key={f} style={styles.pill}>
                  <Text style={styles.pillText}>{f}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          <Animated.View
            style={[styles.card, { opacity: fade, transform: [{ translateY: slide }] }]}>
            <Text style={styles.cardTitle}>Masuk ke akun</Text>

            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              placeholder="Masukkan username"
              placeholderTextColor="#7F89A8"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Masukkan password"
              placeholderTextColor="#7F89A8"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            <TouchableOpacity style={styles.primaryButton} onPress={handleManualLogin}>
              <Text style={styles.primaryText}>Masuk</Text>
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>atau lanjut dengan</Text>
              <View style={styles.dividerLine} />
            </View>

            {error && <Text style={styles.error}>{error}</Text>}

            <TouchableOpacity
              style={[styles.googleButton, loading && styles.disabled]}
              onPress={handleGoogle}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#1B2230" />
              ) : (
                <>
                  <View style={styles.googleBadge}>
                    <Text style={styles.googleBadgeText}>G</Text>
                  </View>
                  <Text style={styles.googleText}>Login with Google</Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>

          <Text style={styles.footer}>Dengan masuk, sesimu tersimpan aman di perangkat ini.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0B1020', overflow: 'hidden' },
  flex: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0B1020',
  },
  blob: { position: 'absolute', borderRadius: 999 },
  blobBlue: {
    width: 320,
    height: 320,
    top: -90,
    left: -110,
    backgroundColor: 'rgba(47, 91, 234, 0.45)',
  },
  blobPurple: {
    width: 260,
    height: 260,
    top: 140,
    right: -120,
    backgroundColor: 'rgba(147, 51, 234, 0.35)',
  },
  blobPink: {
    width: 300,
    height: 300,
    bottom: -120,
    left: -80,
    backgroundColor: 'rgba(219, 39, 119, 0.30)',
  },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  hero: { alignItems: 'center', marginBottom: 24 },
  logo: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: '#2F5BEA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    shadowColor: '#7C9CFF',
    shadowOpacity: 0.8,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  logoText: { color: '#fff', fontSize: 28, fontWeight: 'bold', letterSpacing: 1 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff', textAlign: 'center' },
  tagline: {
    fontSize: 14,
    color: '#AEB8D6',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 16 },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    margin: 4,
  },
  pillText: { color: '#E6EBFF', fontSize: 12, fontWeight: '600' },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  cardTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#CBD3EC', marginBottom: 6 },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#fff',
    marginBottom: 14,
  },
  primaryButton: {
    backgroundColor: '#2F5BEA',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: '#2F5BEA',
    shadowOpacity: 0.6,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 18 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255, 255, 255, 0.16)' },
  dividerText: { marginHorizontal: 12, color: '#9AA5C7', fontSize: 12 },
  error: {
    color: '#FFB4B4',
    backgroundColor: 'rgba(198, 40, 40, 0.25)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 13,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 13,
    backgroundColor: '#fff',
  },
  disabled: { opacity: 0.6 },
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
  googleText: { fontSize: 15, fontWeight: '700', color: '#1B2230' },
  footer: { textAlign: 'center', color: '#7F89A8', fontSize: 12, marginTop: 20 },
});