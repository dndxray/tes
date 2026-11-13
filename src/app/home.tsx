import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useRouter } from 'expo-router';
import { collection, doc, getDoc, onSnapshot } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Button,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { auth, db } from '../firebase';
import { Session, clearSession, getSession, isSessionActive } from '../storage';

type Mahasiswa = {
  id: string;
  nama: string;
  nim: string;
  jurusan: string;
};

function metodeLabel(method: string): string {
  if (method === 'google.com') return 'Google';
  if (method === 'password') return 'Email dan Password';
  return method || '-';
}

function roleLabel(role: string | null): string {
  if (role === 'super_admin') return 'Super Admin';
  if (!role) return 'Tanpa role';
  return role;
}

export default function Home() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [mahasiswa, setMahasiswa] = useState<Mahasiswa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const saved = await getSession();
      if (!isSessionActive(saved)) {
        console.log('[HOME] token tidak aktif -> kembali ke login');
        router.replace('/');
        return;
      }
      setSession(saved);
    })();
  }, []);

  useEffect(() => {
    if (!session) return;

    const unsubscribe = onSnapshot(
      collection(db, 'mahasiswa'),
      (snapshot) => {
        const data: Mahasiswa[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          nama: doc.data().nama ?? '',
          nim: doc.data().nim ?? '',
          jurusan: doc.data().jurusan ?? '',
        }));
        console.log('[FIRESTORE] jumlah mahasiswa ->', data.length);
        setMahasiswa(data);
        setLoading(false);
      },
      (e) => {
        console.error('[FIRESTORE] gagal ambil data:', e);
        setError(e.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [session]);

  useEffect(() => {
    if (!session) return;

    (async () => {
      try {
        const snap = await getDoc(doc(db, 'users', session.uid));
        const r = snap.exists() ? (snap.data().role ?? null) : null;
        console.log('[ROLE] UID', session.uid, '->', r ?? 'tidak ada role');
        setRole(r);
      } catch (e) {
        console.error('[ROLE] gagal membaca role:', e);
        setRole(null);
      } finally {
        setRoleLoading(false);
      }
    })();
  }, [session]);

  const handleLogout = async () => {
    try {
      await GoogleSignin.signOut();
      await auth.signOut();
    } catch (e) {
      console.error('[HOME] gagal signOut:', e);
    }
    await clearSession();
    router.replace('/');
  };

  if (!session) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Daftar Mahasiswa</Text>
      <Text style={styles.subtitle}>
        {session.name} ({session.email})
      </Text>

      <View style={styles.account}>
        <Text style={styles.detail}>Metode login: {metodeLabel(session.method)}</Text>
        <Text style={styles.detail}>UID: {session.uid}</Text>
        <Text style={styles.detail}>
          Role: {roleLoading ? 'memuat...' : roleLabel(role)}
        </Text>
      </View>

      {loading && <ActivityIndicator style={styles.loader} />}
      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={mahasiswa}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.nama}>{item.nama}</Text>
            <Text style={styles.detail}>NIM: {item.nim}</Text>
            <Text style={styles.detail}>Jurusan: {item.jurusan}</Text>
          </View>
        )}
        ListEmptyComponent={
          !loading && !error ? (
            <Text style={styles.empty}>Belum ada data mahasiswa</Text>
          ) : null
        }
      />

      <Button title="Logout" color="#b00020" onPress={handleLogout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 56 },
  center: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 4, marginBottom: 16 },
  account: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#f7f7f7',
  },
  loader: { marginVertical: 12 },
  error: { color: '#b00020', marginBottom: 12 },
  list: { paddingBottom: 16 },
  card: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  nama: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  detail: { fontSize: 14, color: '#444' },
  empty: { textAlign: 'center', color: '#666', marginTop: 24 },
});