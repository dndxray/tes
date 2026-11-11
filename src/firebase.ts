import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyADizfBwo6zkBfrVtul-OTGNYB3VxD2p8o',
  authDomain: 'tugas-firebase-e04cb.firebaseapp.com',
  projectId: 'tugas-firebase-e04cb',
  storageBucket: 'tugas-firebase-e04cb.firebasestorage.app',
  messagingSenderId: '881756257939',
  appId: '1:881756257939:android:712d3b59071d306f095766',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

function createDb() {
  try {
    return initializeFirestore(app, { experimentalForceLongPolling: true });
  } catch {
    return getFirestore(app);
  }
}

export const auth = getAuth(app);
export const db = createDb();

export const WEB_CLIENT_ID =
  '881756257939-ppdfalv3e23riqe03rde3sp3q49r4n9i.apps.googleusercontent.com';