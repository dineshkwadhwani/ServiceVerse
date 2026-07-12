const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const admin = require('firebase-admin');
const { FieldValue } = require('firebase-admin/firestore');
const { v4: uuidv4 } = require('uuid');

function getSeedAdminConfig() {
  const phone = process.env.SEED_ADMIN_PHONE?.trim();
  const secret = process.env.SEED_ADMIN_SECRET;

  if (!phone) throw new Error('SEED_ADMIN_PHONE is not configured');
  if (!secret) throw new Error('SEED_ADMIN_SECRET is not configured');

  return {
    phone,
    firstName: process.env.SEED_ADMIN_FIRST_NAME?.trim() || 'Admin',
    lastName: process.env.SEED_ADMIN_LAST_NAME?.trim() || 'User',
    email: process.env.SEED_ADMIN_EMAIL?.trim() || `admin+${uuidv4()}@serviceverse.app`,
  };
}

function getServiceAccount() {
  const serviceAccountPath =
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    path.join(
      __dirname,
      '../../../serviceverse-dev-fa38e-firebase-adminsdk-fbsvc-18be708d32.json'
    );

  return require(serviceAccountPath);
}

async function seedSuperAdminUser(input) {
  const phone = input.phone.trim();
  const firstName = input.firstName?.trim() || 'Admin';
  const lastName = input.lastName?.trim() || 'User';
  const name = `${firstName} ${lastName}`.trim();
  const email = input.email.trim().toLowerCase();

  const db = admin.firestore();

  // Generate a unique UID for this user in Firestore
  // This will be used temporarily; the actual Firebase Auth UID will be assigned on first phone sign-in
  const uid = uuidv4();

  const userData = {
    uid,
    phone,
    email,
    firstName,
    lastName,
    name,
    role: 'SUPERADMIN',
    status: 'ACTIVE',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  // Create user document in Firestore
  // We'll store it under the temp UID; it will be migrated after first phone sign-in
  await db.collection('users').doc(uid).set(userData, { merge: true });

  // Also create a lookup by phone for easy migration after sign-in
  await db.collection('phoneToUser').doc(phone).set({
    uid,
    email,
    role: 'SUPERADMIN',
  });

  return { uid, phone, name, role: 'SUPERADMIN' };
}

async function main() {
  try {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(getServiceAccount()),
      });
    }

    console.log('Seeding SuperAdmin...\n');
    const config = getSeedAdminConfig();
    const result = await seedSuperAdminUser({
      phone: config.phone,
      firstName: config.firstName,
      lastName: config.lastName,
      email: config.email,
    });

    console.log('✓ SuperAdmin seeded successfully');
    console.log(`  Name: ${result.name}`);
    console.log(`  Phone: ${result.phone}`);
    console.log(`  UID: ${result.uid}`);
    console.log(`  Role: ${result.role}`);
    console.log('\nTo sign in as SuperAdmin:');
    console.log(`  1. Register/Sign in with phone: ${result.phone}`);
    console.log(`  2. This account has SuperAdmin role assigned`);
    process.exit(0);
  } catch (error) {
    console.error('Failed to seed SuperAdmin:', error.message);
    process.exit(1);
  }
}

main();
