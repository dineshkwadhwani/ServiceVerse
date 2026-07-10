#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_ID="${FIREBASE_PROJECT_ID:-serviceverse-dev-fa38e}"
FIREBASE_CLI="npx --yes --package=firebase-tools@15.22.4 firebase"

cd "$ROOT_DIR"

# Service account tokens often fail for rules deploy — use interactive login instead.
unset GOOGLE_APPLICATION_CREDENTIALS

echo "Deploying rules to project: $PROJECT_ID"
echo "Logged in as:"
$FIREBASE_CLI login:list || true
echo ""

deploy_firestore() {
  echo "→ Deploying Firestore rules..."
  $FIREBASE_CLI deploy --only firestore:rules --project "$PROJECT_ID"
}

deploy_storage() {
  echo "→ Deploying Storage rules..."
  $FIREBASE_CLI deploy --only storage --project "$PROJECT_ID"
}

if deploy_firestore; then
  echo "✔ Firestore rules deployed"
else
  echo ""
  echo "Firestore deploy failed. Re-authenticate, then retry:"
  echo "  npx firebase-tools@15.22.4 logout"
  echo "  npx firebase-tools@15.22.4 login --reauth"
  echo "  npm run deploy:rules"
  exit 1
fi

if deploy_storage; then
  echo "✔ Storage rules deployed"
else
  echo ""
  echo "Storage deploy failed (401 usually means expired login or Storage not enabled)."
  echo ""
  echo "Try:"
  echo "  1. npx firebase-tools@15.22.4 login --reauth"
  echo "  2. Enable Storage in Firebase Console → Storage → Get started"
  echo "  3. npm run deploy:rules"
  echo ""
  echo "Or paste storage.rules manually in Firebase Console → Storage → Rules"
  exit 1
fi

echo ""
echo "✔ All rules deployed successfully!"
