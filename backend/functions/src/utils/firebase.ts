import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

export const db = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();
export const messaging = admin.messaging();

// Set up Firestore settings for better performance
db.settings({
  ignoreUndefinedProperties: true,
  cacheSizeBytes: 104857600, // 100MB
});

export default admin;
