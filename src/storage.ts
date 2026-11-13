import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_KEY = 'session';
const TOKEN_LIFETIME_MS = 55 * 60 * 1000;

export type Session = {
  token: string;
  uid: string;
  name: string;
  email: string;
  method: string;
  savedAt: number;
};

export async function saveSession(session: Session) {
  try {
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
    console.log('[STORAGE] SET session ->', session.email);
  } catch (error) {
    console.error('[STORAGE] gagal simpan:', error);
  }
}

export async function getSession(): Promise<Session | null> {
  try {
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch (error) {
    console.error('[STORAGE] gagal ambil:', error);
    return null;
  }
}

export async function clearSession() {
  try {
    await AsyncStorage.removeItem(SESSION_KEY);
    console.log('[STORAGE] REMOVE session');
  } catch (error) {
    console.error('[STORAGE] gagal hapus:', error);
  }
}

export function isSessionActive(session: Session | null): boolean {
  if (!session || !session.token || !session.uid) return false;
  return Date.now() - session.savedAt < TOKEN_LIFETIME_MS;
}