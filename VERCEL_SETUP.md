# Vercel Deployment Setup Guide

## Issue: Deployment Failed

Your deployment on Vercel failed because **environment variables are not configured**. The build succeeds locally but fails on Vercel because it's missing the required credentials for Firebase and Stripe.

## Required Environment Variables

### Firebase Configuration (Public - Safe to Share)
These are client-side keys and are prefixed with `NEXT_PUBLIC_`:

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

### Stripe Configuration (Secret - Keep Private)
These are server-side keys and must be kept secret:

```
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
```

### SendGrid Configuration (Optional)
For newsletter functionality:

```
SENDGRID_API_KEY
```

## Step-by-Step Setup

### Step 1: Get Your Firebase Credentials
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your "Abundant Global Club" project
3. Click Settings (gear icon) → Project Settings
4. Scroll to "Your apps" section
5. Find your web app and copy the config:
   ```javascript
   {
     apiKey: "YOUR_API_KEY",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789012",
     appId: "1:123456789012:web:abcdef1234567890"
   }
   ```

### Step 2: Get Your Stripe Keys
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Click "Developers" → "API Keys"
3. Copy:
   - **Secret Key** (sk_live_... or sk_test_...)
   - **Publishable Key** (pk_live_... or pk_test_...)
4. Go to "Webhooks" to get the webhook secret if needed

### Step 3: Add Environment Variables to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on "Abundant Global Club" project
3. Go to **Settings** → **Environment Variables**
4. Add each variable with its value:

**Firebase Variables:**
```
NEXT_PUBLIC_FIREBASE_API_KEY = YOUR_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID = your-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = 123456789012
NEXT_PUBLIC_FIREBASE_APP_ID = 1:123456789012:web:abcdef1234567890
```

**Stripe Variables:**
```
STRIPE_SECRET_KEY = sk_test_... (or sk_live_... for production)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = pk_test_... (or pk_live_... for production)
STRIPE_WEBHOOK_SECRET = whsec_... (from Webhooks section)
```

### Step 4: Select Environment
For each variable, select which environments it applies to:
- **Production** (required for live site)
- **Preview** (for preview deployments)
- **Development** (for local development)

Typically select all three for Firebase and Stripe variables.

### Step 5: Redeploy
1. Once all variables are set, Vercel will automatically trigger a new deployment
2. Or manually go to **Deployments** and click "Redeploy" on the latest commit

### Step 6: Verify Deployment
Check the "Deployments" tab to see if the new build succeeded (green checkmark).

## Testing Locally with Environment Variables

Create a `.env.local` file in your project root:

```bash
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Stripe
STRIPE_SECRET_KEY=sk_test_your_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

Then run:
```bash
pnpm dev
```

## Troubleshooting

### Build still fails after adding variables?
1. Go to **Deployments** → Click on the failed deployment → **View Build Logs**
2. Look for error messages
3. Verify all variable names are spelled correctly
4. Ensure you're using the correct key values (not copied from docs)

### Website shows blank or errors?
1. Check browser console (F12) for errors
2. Verify Firebase credentials are correct
3. Check that RLS policies are configured in Firestore if needed

### Test Credentials (for development)
Use these to test the auth system:
- Email: `admin@abundant.club` / Password: `Admin@123456`
- Email: `member@abundant.club` / Password: `Member@123456`

## Production Checklist

- [ ] Firebase variables set in Vercel
- [ ] Stripe variables set in Vercel
- [ ] Custom domain (abundantglobalclub.com) configured
- [ ] DNS records configured (pointing to Vercel)
- [ ] SSL certificate provisioned
- [ ] Test deployment successful (green checkmark)
- [ ] Test login functionality
- [ ] Test event creation in admin panel
- [ ] Monitor error logs for first week

Your website will deploy successfully once these environment variables are configured in Vercel!
