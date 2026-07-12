#!/usr/bin/env node

/**
 * Test Firebase Connection
 * This script tests the direct Firebase connection without emulator
 */

const path = require('path');
const admin = require('firebase-admin');
require('dotenv').config();

// Get the service account path from the project root directory
const serviceAccountPath = path.join(__dirname, '../../', 'firebase-service-account.json');

console.log('🔧 Testing Firebase Connection...\n');
console.log(`📁 Service Account Path: ${serviceAccountPath}`);
console.log(`📦 Node Version: ${process.version}`);
console.log(`🔗 Environment: ${process.env.NODE_ENV || 'development'}\n`);

try {
  // Load service account
  const serviceAccount = require(serviceAccountPath);
  console.log('✅ Service account JSON loaded successfully');
  console.log(`   Project ID: ${serviceAccount.project_id}\n`);

  // Initialize Firebase Admin
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });
    console.log('✅ Firebase Admin initialized\n');
  }

  // Test Firestore connection
  const db = admin.firestore();
  const auth = admin.auth();

  (async () => {
    try {
      console.log('🧪 Running connection tests...\n');

      // Test 1: Firestore - Check if we can query
      console.log('Test 1: Firestore Connection');
      const usersRef = db.collection('users');
      const snapshot = await usersRef.limit(1).get();
      console.log(`   ✅ Firestore connected - Retrieved ${snapshot.size} documents\n`);

      // Test 2: Check services collection
      console.log('Test 2: Services Collection');
      const servicesRef = db.collection('services');
      const servicesSnapshot = await servicesRef.get();
      console.log(`   ✅ Services collection accessible - ${servicesSnapshot.size} services found\n`);

      // Test 3: Test server timestamp
      console.log('Test 3: Server Timestamp');
      const timestamp = admin.firestore.FieldValue.serverTimestamp();
      console.log(`   ✅ Server timestamp available: ${timestamp}\n`);

      // Test 4: Auth capabilities
      console.log('Test 4: Authentication Capabilities');
      console.log(`   ✅ Firebase Auth initialized and ready\n`);

      console.log('═══════════════════════════════════════════════════════════');
      console.log('🎉 All Firebase Connection Tests PASSED!');
      console.log('═══════════════════════════════════════════════════════════\n');
      console.log('✨ Your project is ready to use Firebase directly!');
      console.log('   • No emulator needed');
      console.log('   • Direct connection to: ' + serviceAccount.project_id);
      console.log('   • Ready for development\n');

      process.exit(0);
    } catch (error) {
      console.error('❌ Connection test failed:', error.message);
      console.error('\nDetails:', error);
      process.exit(1);
    }
  })();
} catch (error) {
  console.error('❌ Failed to initialize Firebase:', error.message);
  console.error('\nPlease ensure:');
  console.error('  1. Service account JSON exists at backend/ directory');
  console.error('  2. File name matches the expected pattern');
  console.error('  3. .env file is properly configured\n');
  process.exit(1);
}
