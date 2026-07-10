#!/usr/bin/env node
/**
 * Deploy Firestore + Storage rules using the Firebase Rules REST API
 * and the service account JSON (bypasses broken Firebase CLI auth).
 */
const fs = require('fs');
const path = require('path');
const { GoogleAuth } = require('google-auth-library');

const ROOT = path.resolve(__dirname, '..');
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'serviceverse-dev-fa38e';
const SERVICE_ACCOUNT_PATH =
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  path.join(ROOT, 'serviceverse-dev-fa38e-firebase-adminsdk-fbsvc-18be708d32.json');
const STORAGE_BUCKET =
  process.env.FIREBASE_STORAGE_BUCKET || 'serviceverse-dev-fa38e.firebasestorage.app';

async function getAccessToken() {
  const auth = new GoogleAuth({
    keyFile: SERVICE_ACCOUNT_PATH,
    scopes: [
      'https://www.googleapis.com/auth/cloud-platform',
      'https://www.googleapis.com/auth/firebase',
    ],
  });

  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  if (!tokenResponse.token) {
    throw new Error('Failed to obtain access token from service account');
  }
  return tokenResponse.token;
}

async function apiRequest(token, url, method, body) {
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${method} ${url} failed (${response.status}): ${text}`);
  }

  return text ? JSON.parse(text) : null;
}

async function deployRuleset(token, rulesFile, releaseId) {
  const content = fs.readFileSync(path.join(ROOT, rulesFile), 'utf8');

  console.log(`→ Creating ruleset from ${rulesFile}...`);
  const ruleset = await apiRequest(
    token,
    `https://firebaserules.googleapis.com/v1/projects/${PROJECT_ID}/rulesets`,
    'POST',
    {
      source: {
        files: [{ name: rulesFile, content }],
      },
    }
  );

  console.log(`→ Publishing release ${releaseId}...`);
  await apiRequest(
    token,
    `https://firebaserules.googleapis.com/v1/projects/${PROJECT_ID}/releases/${releaseId}?updateMask=rulesetName`,
    'PATCH',
    {
      name: `projects/${PROJECT_ID}/releases/${releaseId}`,
      rulesetName: ruleset.name,
    }
  );

  console.log(`✔ ${releaseId} deployed`);
}

async function main() {
  if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    console.error(`Service account not found: ${SERVICE_ACCOUNT_PATH}`);
    process.exit(1);
  }

  console.log(`Deploying rules to ${PROJECT_ID}`);
  console.log(`Using service account: ${SERVICE_ACCOUNT_PATH}`);
  console.log('');

  const token = await getAccessToken();

  await deployRuleset(token, 'firestore.rules', 'cloud.firestore');
  await deployRuleset(
    token,
    'storage.rules',
    `firebase.storage/${STORAGE_BUCKET}`
  );

  console.log('');
  console.log('✔ All rules deployed successfully!');
}

main().catch((error) => {
  console.error('');
  console.error('Deploy failed:', error.message);
  console.error('');
  console.error('If you see 403, grant these IAM roles to the service account in Google Cloud IAM:');
  console.error('  - Firebase Admin');
  console.error('  - Firebase Rules Admin');
  process.exit(1);
});
