const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const admin = require('firebase-admin');
const { FieldValue } = require('firebase-admin/firestore');

function getSeedAdminConfig() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim();
  const password = process.env.SEED_ADMIN_PASSWORD;
  const secret = process.env.SEED_ADMIN_SECRET;

  if (!email) throw new Error('SEED_ADMIN_EMAIL is not configured');
  if (!password) throw new Error('SEED_ADMIN_PASSWORD is not configured');
  if (!secret) throw new Error('SEED_ADMIN_SECRET is not configured');

  return {
    email,
    password,
    secret,
    firstName: process.env.SEED_ADMIN_FIRST_NAME?.trim(),
    lastName: process.env.SEED_ADMIN_LAST_NAME?.trim(),
    phone: process.env.SEED_ADMIN_PHONE?.trim(),
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
  const email = input.email.trim().toLowerCase();
  const firstName = input.firstName?.trim() || 'Admin';
  const lastName = input.lastName?.trim() || 'User';
  const name = `${firstName} ${lastName}`.trim();

  const userData = {
    email,
    firstName,
    lastName,
    name,
    phone: input.phone?.trim() || '',
    role: 'SUPERADMIN',
    status: 'ACTIVE',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  let authUser;
  let created = false;
  let updated = false;

  try {
    authUser = await admin.auth().getUserByEmail(email);
    await admin.auth().updateUser(authUser.uid, {
      password: input.password,
      emailVerified: true,
      displayName: name,
    });
    updated = true;
  } catch (error) {
    if (error.code !== 'auth/user-not-found') throw error;

    authUser = await admin.auth().createUser({
      email,
      password: input.password,
      emailVerified: true,
      displayName: name,
    });
    created = true;
  }

  const profile = { uid: authUser.uid, ...userData };
  const db = admin.firestore();

  await Promise.all([
    db.collection('users').doc(authUser.uid).set(profile, { merge: true }),
    db.collection('superadmins').doc(authUser.uid).set(profile, { merge: true }),
  ]);

  await admin.auth().setCustomUserClaims(authUser.uid, { role: 'SUPERADMIN' });

  return { uid: authUser.uid, email, role: 'SUPERADMIN', created, updated };
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
      email: config.email,
      password: config.password,
      firstName: config.firstName,
      lastName: config.lastName,
      phone: config.phone,
    });

    console.log('SuperAdmin seeded successfully');
    console.log(`Email: ${result.email}`);
    console.log(`UID: ${result.uid}`);
    console.log(`Created: ${result.created}`);
    console.log(`Updated: ${result.updated}`);
    process.exit(0);
  } catch (error) {
    console.error('Failed to seed SuperAdmin:', error.message);
    process.exit(1);
  }
}

main();
