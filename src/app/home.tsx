import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useRouter } from 'expo-router';
import { collection, onSnapshot } from 'firebase/firestore';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  FlatList,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { auth, db } from '../firebase';
import { Session, clearSession, getSession, isSessionActive } from '../storage';
import { AVATAR_COLORS } from '../theme';

type Mahasiswa = {
  id: string;
  nama: string;
  nim: string;
  jurusan: string;
};

const SEMUA = 'Semua';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0] ?? '';
  const second = parts.length > 1 ? parts[1][0] ?? '' : '';
  return (first + second).toUpperCase();
}

function avatarColor(name: string): string {
  let sum = 0;
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [session, setSession] = useState<Session | null>(null);
  const [mahasiswa, setMahasiswa] = useState<Mahasiswa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [jurusanAktif, setJurusanAktif] = useState(SEMUA);

  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(30)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    (async () => {
      const saved = await getSession();
      if (!isSessionActive(saved)) {
        console.log('[Auth] sesi kedaluwarsa, kembali ke halaman login');
        router.replace('/');
        return;
      }
      setSession(saved);
    })();
  }, []);

  useEffect(() => {
    if (!session) return;

    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 1400, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1400, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [session]);

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
        data.sort((a, b) => a.nama.localeCompare(b.nama));
        console.log('[Data] mahasiswa berhasil dimuat:', data.length);
        setMahasiswa(data);
        setLoading(false);
      },
      (e) => {
        console.error('[Data] gagal memuat mahasiswa:', e);
        setError(e.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [session]);

  const daftarJurusan = useMemo(() => {
    const unik = Array.from(new Set(mahasiswa.map((m) => m.jurusan).filter(Boolean)));
    return [SEMUA, ...unik];
  }, [mahasiswa]);

  const hasil = useMemo(() => {
    const q = query.trim().toLowerCase();
    return mahasiswa.filter((m) => {
      const cocokJurusan = jurusanAktif === SEMUA || m.jurusan === jurusanAktif;
      const cocokKata =
        !q || m.nama.toLowerCase().includes(q) || m.nim.toLowerCase().includes(q);
      return cocokJurusan && cocokKata;
    });
  }, [mahasiswa, query, jurusanAktif]);

  const handleLogout = async () => {
    try {
      await GoogleSignin.signOut();
      await auth.signOut();
    } catch (e) {
      console.error('[Auth] gagal keluar dari akun:', e);
    }
    await clearSession();
    router.replace('/');
  };

  const konfirmasiLogout = () => {
    Alert.alert('Keluar', 'Yakin ingin keluar dari akun ini?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Keluar', style: 'destructive', onPress: handleLogout },
    ]);
  };

  if (!session) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#7C9CFF" />
      </View>
    );
  }

  const namaDepan = session.name.split(' ')[0] || 'Pengguna';

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0B1020" />

      <View style={[styles.blob, styles.blobBlue]} />
      <View style={[styles.blob, styles.blobPurple]} />
      <View style={[styles.blob, styles.blobPink]} />

      <Animated.View
        style={[
          styles.content,
          {
            paddingTop: insets.top + 12,
            opacity: fade,
            transform: [{ translateY: slide }],
          },
        ]}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.hello}>Selamat datang</Text>
            <Text style={styles.greeting} numberOfLines={1}>
              {namaDepan}
            </Text>
            <Text style={styles.email} numberOfLines={1}>
              {session.email}
            </Text>
          </View>
          <Animated.View
            style={[
              styles.avatarBig,
              { backgroundColor: avatarColor(session.name), transform: [{ scale: pulse }] },
            ]}>
            <Text style={styles.avatarBigText}>{initials(session.name)}</Text>
          </Animated.View>
        </View>

        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, styles.summaryBlue]}>
            <Text style={styles.summaryNumber}>{mahasiswa.length}</Text>
            <Text style={styles.summaryLabel}>Total mahasiswa</Text>
          </View>
          <View style={[styles.summaryCard, styles.summaryPurple]}>
            <Text style={styles.summaryNumber}>{Math.max(daftarJurusan.length - 1, 0)}</Text>
            <Text style={styles.summaryLabel}>Jurusan</Text>
          </View>
        </View>

        <TextInput
          style={styles.search}
          placeholder="Cari nama atau NIM"
          placeholderTextColor="#7F89A8"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <View style={styles.chipsWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {daftarJurusan.map((j) => {
              const aktif = j === jurusanAktif;
              return (
                <TouchableOpacity
                  key={j}
                  style={[styles.chip, aktif && styles.chipActive]}
                  onPress={() => setJurusanAktif(j)}>
                  <Text style={[styles.chipText, aktif && styles.chipTextActive]}>{j}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        {loading ? (
          <ActivityIndicator style={styles.loader} color="#7C9CFF" />
        ) : (
          <FlatList
            data={hasil}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={[styles.avatar, { backgroundColor: avatarColor(item.nama) }]}>
                  <Text style={styles.avatarText}>{initials(item.nama)}</Text>
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.nama} numberOfLines={1}>
                    {item.nama}
                  </Text>
                  <Text style={styles.nim}>NIM {item.nim}</Text>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.jurusan}</Text>
                  </View>
                </View>
              </View>
            )}
            ListEmptyComponent={
              !error ? (
                <Text style={styles.empty}>
                  {mahasiswa.length === 0
                    ? 'Belum ada data mahasiswa'
                    : 'Tidak ada mahasiswa yang cocok'}
                </Text>
              ) : null
            }
          />
        )}

        <TouchableOpacity
          style={[styles.logoutButton, { marginBottom: insets.bottom + 12 }]}
          onPress={konfirmasiLogout}>
          <Text style={styles.logoutText}>Keluar</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0B1020', overflow: 'hidden' },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0B1020',
  },
  content: { flex: 1, paddingHorizontal: 20 },
  blob: { position: 'absolute', borderRadius: 999 },
  blobBlue: {
    width: 320,
    height: 320,
    top: -100,
    left: -110,
    backgroundColor: 'rgba(47, 91, 234, 0.40)',
  },
  blobPurple: {
    width: 260,
    height: 260,
    top: 260,
    right: -130,
    backgroundColor: 'rgba(147, 51, 234, 0.28)',
  },
  blobPink: {
    width: 300,
    height: 300,
    bottom: -130,
    left: -90,
    backgroundColor: 'rgba(219, 39, 119, 0.26)',
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  headerText: { flex: 1, marginRight: 12 },
  hello: { fontSize: 13, color: '#AEB8D6' },
  greeting: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginTop: 2 },
  email: { fontSize: 13, color: '#9AA5C7', marginTop: 2 },
  avatarBig: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    shadowColor: '#7C9CFF',
    shadowOpacity: 0.8,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },
  avatarBigText: { color: '#fff', fontWeight: 'bold', fontSize: 20 },
  summaryRow: { flexDirection: 'row', marginBottom: 14 },
  summaryCard: {
    flex: 1,
    borderRadius: 18,
    padding: 16,
    marginRight: 10,
    borderWidth: 1,
  },
  summaryBlue: {
    backgroundColor: 'rgba(47, 91, 234, 0.22)',
    borderColor: 'rgba(124, 156, 255, 0.45)',
  },
  summaryPurple: {
    backgroundColor: 'rgba(147, 51, 234, 0.22)',
    borderColor: 'rgba(196, 140, 255, 0.45)',
  },
  summaryNumber: { fontSize: 30, fontWeight: 'bold', color: '#fff' },
  summaryLabel: { fontSize: 12, color: '#CBD3EC', marginTop: 2 },
  search: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#fff',
    marginBottom: 12,
  },
  chipsWrapper: { marginBottom: 12 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    marginRight: 8,
  },
  chipActive: { backgroundColor: '#2F5BEA', borderColor: '#7C9CFF' },
  chipText: { fontSize: 13, color: '#CBD3EC', fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  error: {
    color: '#FFB4B4',
    backgroundColor: 'rgba(198, 40, 40, 0.25)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 13,
  },
  loader: { marginTop: 24 },
  list: { paddingBottom: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 17 },
  cardBody: { flex: 1 },
  nama: { fontSize: 16, fontWeight: '700', color: '#fff' },
  nim: { fontSize: 13, color: '#AEB8D6', marginTop: 2, marginBottom: 6 },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(124, 156, 255, 0.20)',
    borderWidth: 1,
    borderColor: 'rgba(124, 156, 255, 0.45)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeText: { fontSize: 12, color: '#C9D6FF', fontWeight: '600' },
  empty: { textAlign: 'center', color: '#9AA5C7', marginTop: 32 },
  logoutButton: {
    borderWidth: 1,
    borderColor: 'rgba(255, 120, 120, 0.7)',
    backgroundColor: 'rgba(198, 40, 40, 0.18)',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutText: { color: '#FFB4B4', fontSize: 15, fontWeight: '700' },
});