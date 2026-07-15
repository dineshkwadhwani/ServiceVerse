# ServiceVerse Vercel Deployment Guide

This guide explains how to deploy ServiceVerse frontend to Vercel.

## Prerequisites

1. **Vercel Account**: Create one at [vercel.com](https://vercel.com)
2. **Git Repository**: Push your code to GitHub
3. **Environment Variables**: Have your Firebase config ready

## Deployment Steps

### 1. Connect Repository to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Select your GitHub repository (ServiceVerse)
4. Click "Import"

### 2. Configure Environment Variables

In the Vercel project settings, add the following environment variables:

```
VITE_API_URL = https://us-central1-serviceverse-dev-fa38e.cloudfunctions.net/api
VITE_FIREBASE_API_KEY = [your-firebase-api-key]
VITE_FIREBASE_AUTH_DOMAIN = serviceverse-dev-fa38e.firebaseapp.com
VITE_FIREBASE_PROJECT_ID = serviceverse-dev-fa38e
VITE_FIREBASE_STORAGE_BUCKET = serviceverse-dev-fa38e.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID = [your-messaging-sender-id]
VITE_FIREBASE_APP_ID = [your-firebase-app-id]
```

**Replace the values** with your actual Firebase project credentials.

### 3. Configure Build Settings

The `vercel.json` file is already configured with:
- **Build Command**: `npm run build:frontend`
- **Output Directory**: `frontend/dist`
- **Install Command**: `npm ci`

No additional configuration needed - Vercel will auto-detect these settings.

### 4. Deploy

1. Click "Deploy" button
2. Vercel will:
   - Install dependencies from `package.json`
   - Build the frontend with `npm run build:frontend`
   - Deploy the dist folder to Vercel's CDN

Once deployed, you'll get a unique URL like: `https://serviceverse-xxxx.vercel.app`

## Testing After Deployment

### Email OTP (Works on both Local & Vercel)
- Click "Email OTP" button during registration
- Check email for OTP code
- Enter code to verify

### Phone OTP (Works ONLY on Vercel, not localhost)
- Click "Phone OTP" button during registration
- Google reCAPTCHA will activate (requires valid domain)
- SMS OTP will be sent to the phone number
- Enter code to verify

**Note**: Phone OTP requires a valid domain with reCAPTCHA configured. On localhost, you'll get an error - use email OTP for local testing instead.

## Environment Variables Details

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Firebase Cloud Functions API endpoint |
| `VITE_FIREBASE_API_KEY` | Firebase API key (public) |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | FCM sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |

Find these values in:
- Firebase Console → Project Settings → "Your apps" → Web app config

## Common Issues

### "VITE_API_URL is not defined"
- Add `VITE_API_URL` environment variable in Vercel project settings
- Make sure it points to your Firebase Cloud Functions endpoint

### Phone OTP not working
- Vercel domain must be added to reCAPTCHA allowed domains in Google Cloud Console
- Check Firebase SMS quota isn't exceeded
- Verify Firebase Phone Auth is enabled in your project

### Build fails with "Module not found"
- Make sure all dependencies are listed in `package.json`
- Check that path aliases in `tsconfig.json` are correct
- Run `npm install` locally and verify it works

## Rollback to Previous Deployment

1. Go to Vercel Dashboard
2. Select your project
3. Go to "Deployments" tab
4. Click the deployment you want to rollback to
5. Click "Promote to Production"

## Monitoring & Logs

1. **Build Logs**: Vercel Dashboard → Deployments → click deployment
2. **Error Tracking**: Vercel Analytics or integrate with Sentry
3. **Performance**: Vercel Web Analytics automatically enabled

## Custom Domain

To use a custom domain:

1. Go to Vercel Project Settings → "Domains"
2. Add your domain (e.g., `serviceverse.com`)
3. Update DNS records as instructed
4. Wait for DNS propagation (usually 24 hours)

## Continuous Deployment

- Every push to `main` branch triggers automatic deployment
- Pull request deployments available for previewing changes
- Rollback any deployment with one click

## Support

For issues with:
- **Vercel Deployment**: Check [Vercel Docs](https://vercel.com/docs)
- **Firebase Config**: Check [Firebase Console](https://console.firebase.google.com)
- **Phone OTP on Vercel**: Ensure reCAPTCHA domain is configured

---

**Happy Deploying!** 🚀
