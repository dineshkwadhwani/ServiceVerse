import { FieldValue } from 'firebase-admin/firestore';
import { auth, db } from '@/utils/firebase';
import { Logger } from '@/utils/logger';

const logger = new Logger('SeedAdmin');

export interface SeedSuperAdminInput {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface SeedSuperAdminResult {
  uid: string;
  email: string;
  role: 'SUPERADMIN';
  created: boolean;
  updated: boolean;
}

export async function seedSuperAdminUser(
  input: SeedSuperAdminInput
): Promise<SeedSuperAdminResult> {
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
    role: 'SUPERADMIN' as const,
    status: 'ACTIVE' as const,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  let authUser;
  let created = false;
  let updated = false;

  try {
    authUser = await auth.getUserByEmail(email);
    await auth.updateUser(authUser.uid, {
      password: input.password,
      emailVerified: true,
      displayName: name,
    });
    updated = true;
    logger.info('Updated existing auth user', { uid: authUser.uid, email });
  } catch (error: any) {
    if (error.code !== 'auth/user-not-found') {
      throw error;
    }

    authUser = await auth.createUser({
      email,
      password: input.password,
      emailVerified: true,
      displayName: name,
    });
    created = true;
    logger.info('Created auth user', { uid: authUser.uid, email });
  }

  const profile = {
    uid: authUser.uid,
    ...userData,
  };

  await Promise.all([
    db.collection('users').doc(authUser.uid).set(profile, { merge: true }),
    db.collection('superadmins').doc(authUser.uid).set(profile, { merge: true }),
  ]);

  await auth.setCustomUserClaims(authUser.uid, { role: 'SUPERADMIN' });
  logger.info('SuperAdmin seeded', { uid: authUser.uid, email, created, updated });

  return {
    uid: authUser.uid,
    email,
    role: 'SUPERADMIN',
    created,
    updated,
  };
}

export function getSeedAdminConfig() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim();
  const password = process.env.SEED_ADMIN_PASSWORD;
  const secret = process.env.SEED_ADMIN_SECRET;

  if (!email) {
    throw new Error('SEED_ADMIN_EMAIL is not configured');
  }
  if (!password) {
    throw new Error('SEED_ADMIN_PASSWORD is not configured');
  }
  if (!secret) {
    throw new Error('SEED_ADMIN_SECRET is not configured');
  }

  return {
    email,
    password,
    secret,
    firstName: process.env.SEED_ADMIN_FIRST_NAME?.trim(),
    lastName: process.env.SEED_ADMIN_LAST_NAME?.trim(),
    phone: process.env.SEED_ADMIN_PHONE?.trim(),
  };
}
