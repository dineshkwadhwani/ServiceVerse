const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Initialize Firebase Admin SDK
const serviceAccount = {
  type: 'service_account',
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID || '116934857894857298571',
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url:
    'https://www.googleapis.com/oauth2/v1/certs',
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
});

const db = admin.firestore();
const auth = admin.auth();

async function seedAdmin() {
  try {
    console.log('🌱 Seeding admin user...\n');

    // Admin user details
    const adminEmail = 'admin@serviceverse.com';
    const adminPassword = 'Admin@123456';
    const adminData = {
      email: adminEmail,
      firstName: 'Admin',
      lastName: 'User',
      role: 'SUPERADMIN',
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'ACTIVE',
    };

    // Step 1: Create user in Firebase Auth
    console.log(`📝 Creating auth user: ${adminEmail}`);
    let authUser;
    try {
      authUser = await auth.getUserByEmail(adminEmail);
      console.log(`   ✓ Auth user already exists (UID: ${authUser.uid})`);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        authUser = await auth.createUser({
          email: adminEmail,
          password: adminPassword,
          emailVerified: true,
        });
        console.log(`   ✓ Auth user created (UID: ${authUser.uid})`);
      } else {
        throw error;
      }
    }

    // Step 2: Add user document to Firestore
    console.log(`\n📊 Creating Firestore user document...`);
    await db.collection('users').doc(authUser.uid).set(
      {
        uid: authUser.uid,
        ...adminData,
      },
      { merge: true }
    );
    console.log(`   ✓ User document created`);

    // Step 3: Set custom claims
    console.log(`\n🔐 Setting custom claims...`);
    await auth.setCustomUserClaims(authUser.uid, {
      role: 'SUPERADMIN',
    });
    console.log(`   ✓ Custom claims set`);

    console.log(`\n✅ Admin user created successfully!\n`);
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`🔑 Password: ${adminPassword}`);
    console.log(`🆔 UID: ${authUser.uid}`);
    console.log(`\n⚠️  Keep these credentials safe!`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin:', error.message);
    process.exit(1);
  }
}

seedAdmin();
