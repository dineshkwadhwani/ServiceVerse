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

async function recreateAdmin() {
  try {
    console.log('🌱 Recreating admin user...\n');

    // New admin user details
    const adminEmail = 'dinesh.k.wadhwani@gmail.com';
    const adminPassword = 'Din@16275';
    const adminData = {
      email: adminEmail,
      firstName: 'Dinesh',
      lastName: 'Wadhwani',
      phone: '9767676738',
      role: 'SUPERADMIN',
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'ACTIVE',
    };

    // Step 1: Delete old admin user if it exists
    console.log('🗑️  Removing old admin user...');
    try {
      const oldAdmin = await auth.getUserByEmail('admin@serviceverse.com');
      await auth.deleteUser(oldAdmin.uid);
      await db.collection('users').doc(oldAdmin.uid).delete();
      console.log('   ✓ Old admin user removed\n');
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log('   ✓ No old admin user found\n');
      } else {
        throw error;
      }
    }

    // Step 2: Create new admin user in Firebase Auth
    console.log(`📝 Creating new admin user: ${adminEmail}`);
    let authUser;
    try {
      authUser = await auth.getUserByEmail(adminEmail);
      console.log(`   ✓ Auth user already exists (UID: ${authUser.uid})`);
      // Update password
      await auth.updateUser(authUser.uid, {
        password: adminPassword,
      });
      console.log(`   ✓ Password updated`);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        authUser = await auth.createUser({
          email: adminEmail,
          password: adminPassword,
          emailVerified: false,
        });
        console.log(`   ✓ Auth user created (UID: ${authUser.uid})`);
      } else {
        throw error;
      }
    }

    // Step 3: Add user document to Firestore
    console.log(`\n📊 Creating Firestore user document...`);
    await db.collection('users').doc(authUser.uid).set(
      {
        uid: authUser.uid,
        ...adminData,
      },
      { merge: true }
    );
    console.log(`   ✓ User document created`);

    // Step 4: Set custom claims
    console.log(`\n🔐 Setting custom claims...`);
    await auth.setCustomUserClaims(authUser.uid, {
      role: 'SUPERADMIN',
    });
    console.log(`   ✓ Custom claims set`);

    console.log(`\n✅ Super admin user created successfully!\n`);
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`🔑 Password: ${adminPassword}`);
    console.log(`👤 Name: ${adminData.firstName} ${adminData.lastName}`);
    console.log(`📱 Phone: ${adminData.phone}`);
    console.log(`🆔 UID: ${authUser.uid}`);
    console.log(`\n⚠️  Keep these credentials safe!`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error recreating admin:', error.message);
    process.exit(1);
  }
}

recreateAdmin();
