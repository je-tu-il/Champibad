import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

export const firebaseConfig = {
  apiKey: Platform.OS === 'android'
    ? 'AIzaSyAwrxSgniXsbbSFzvKrhgNJe2Czf6S_-ME'
    : 'AIzaSyAEamqj54xyQD1PjtWhtWMIQVQ54E2ADIw',
  authDomain: 'champibad-cf772.firebaseapp.com',
  projectId: 'champibad-cf772',
  storageBucket: 'champibad-cf772.firebasestorage.app',
  messagingSenderId: '172205690175',
  appId: Platform.OS === 'android'
    ? '1:172205690175:android:3a41c06776b858cea9978a'
    : '1:172205690175:ios:ec837ad5745fb603a9978a',
};

// Initialisation sécurisée de Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
