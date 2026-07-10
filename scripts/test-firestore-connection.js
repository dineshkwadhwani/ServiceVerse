#!/usr/bin/env node
const path = require('path');
const admin = require('firebase-admin');

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'serviceverse-dev-fa38e';
const SERVICE_ACCOUNT_PATH =
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  path.join(__dirname, '..', `serviceverse-dev-fa38e-firebase-adminsdk-fbsvc-18be708d32.json`);

// eslint-disable-next-line import/no-dynamic-require, global-require
const serviceAccount = require(SERVICE_ACCOUNT_PATH);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: PROJECT_ID,
});

async function testFirestoreConnection() {
  const db = admin.firestore();
  const start = Date.now();
  const testDocId = `connectivity-${Date.now()}`;
  const testRef = db.collection('_connectivity_test').doc(testDocId);

  console.log(`Project: ${PROJECT_ID}`);
  console.log(`Service account: ${serviceAccount.client_email}`);
  console.log('');

  const collections = await db.listCollections();
  console.log(`✔ Connected — found ${collections.length} top-level collection(s)`);
  if (collections.length > 0) {
    console.log(`  Collections: ${collections.map((c) => c.id).join(', ')}`);
  }

  await testRef.set({
    message: 'ServiceVerse connectivity test',
    testedAt: admin.firestore.FieldValue.serverTimestamp(),
    source: 'scripts/test-firestore-connection.js',
  });

  const readBack = await testRef.get();
  if (!readBack.exists) {
    throw new Error('Write succeeded but read-back failed');
  }

  await testRef.delete();

  console.log(`✔ Write, read, and delete succeeded (${Date.now() - start}ms)`);
  console.log('');
  console.log('Firestore connection is working.');
}

testFirestoreConnection().catch((error) => {
  console.error('');
  console.error('✘ Firestore connection failed');
  console.error(error.message || error);
  process.exit(1);
});
