import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize messaging for push notifications
let messaging: any = null;
try {
  messaging = getMessaging(app);
} catch (error) {
  console.warn('Messaging not available:', error);
}

// Connect to emulators in development
if (import.meta.env.DEV && typeof window !== 'undefined') {
  // Auth emulator
  try {
    connectAuthEmulator(auth, 'http://localhost:9099');
  } catch (error) {
    // Already connected or not available
  }

  // Firestore emulator
  try {
    connectFirestoreEmulator(db, 'localhost', 8080);
  } catch (error) {
    // Already connected or not available
  }

  // Storage emulator
  try {
    connectStorageEmulator(storage, 'localhost', 9199);
  } catch (error) {
    // Already connected or not available
  }
}

// Firebase Messaging Service
export async function initFCM() {
  if (!messaging) return null;

  try {
    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    });
    return token;
  } catch (error) {
    console.error('Failed to get FCM token:', error);
    return null;
  }
}

export function listenForMessages(callback: (payload: any) => void) {
  if (!messaging) return;

  onMessage(messaging, (payload) => {
    console.log('Message received:', payload);
    callback(payload);
  });
}

export default app;
