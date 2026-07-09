#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_ID="${FIREBASE_PROJECT_ID:-serviceverse-dev-a6b72}"

cd "$ROOT_DIR"

# Prefer interactive Firebase login over service account credentials.
# To force service account auth, set GOOGLE_APPLICATION_CREDENTIALS before running.
if [[ -z "${GOOGLE_APPLICATION_CREDENTIALS:-}" ]]; then
  echo "Using Firebase CLI user login (run 'npx firebase-tools login' if deploy fails)."
else
  echo "Using service account: $GOOGLE_APPLICATION_CREDENTIALS"
fi

echo "Deploying Firestore + Storage rules to project: $PROJECT_ID"
echo ""

# Use an isolated npx install to avoid monorepo dependency conflicts on Node 22.
npx --yes --package=firebase-tools@15.22.4 firebase deploy \
  --only firestore:rules,storage \
  --project "$PROJECT_ID"
