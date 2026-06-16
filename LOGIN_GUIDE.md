## 🔐 ABUNDANT GLOBAL CLUB - TEST LOGIN CREDENTIALS

### Admin Dashboard Login
**Email:** admin@abundant.club  
**Password:** Admin@123456  
**URL:** http://localhost:3000/admin

### Member Dashboard Login
**Email:** member@abundant.club  
**Password:** Member@123456  
**URL:** http://localhost:3000/dashboard

---

## 🚀 How to Set Up These Accounts

### Step 1: Download Firebase Service Account Key
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your Abundant project
3. Click **Settings** ⚙️ → **Project Settings** → **Service Accounts** tab
4. Click **Generate New Private Key**
5. Save the JSON file as `firebase-admin-key.json` in your project root (alongside package.json)

### Step 2: Run the Setup Script
```bash
cd /vercel/share/v0-project
node scripts/setup-auth.mjs
```

This will:
- ✅ Create admin account with full platform access
- ✅ Create member account with dashboard access
- ✅ Set up Firestore user documents automatically
- ✅ Configure role-based access control

### Step 3: Test Login
1. Go to http://localhost:3000/login
2. Use the credentials above
3. You'll be redirected to the appropriate dashboard

---

## 📱 What Each Role Can Access

### Admin (admin@abundant.club)
- ✅ `/admin` - Main admin dashboard
- ✅ `/admin/members` - User management
- ✅ `/admin/events` - Event creation & management
- ✅ `/admin/testimonials` - Review & approve testimonials
- ✅ `/admin/pages` - CMS for website pages
- ✅ `/admin/settings` - Integration settings, API keys
- ✅ `/admin/billing` - Subscription management

### Member (member@abundant.club)
- ✅ `/dashboard` - Member dashboard home
- ✅ `/dashboard/profile` - Profile & settings
- ✅ `/dashboard/events` - View & register for events
- ✅ `/dashboard/testimonials` - Submit testimonials
- ✅ `/dashboard/memberships` - View membership options
- ✅ `/events` - Browse public events

---

## ❓ Frequently Asked Questions

**Q: Do I have to create the service account key?**
A: Yes, the setup script requires it for Firebase Admin SDK access.

**Q: What if the user already exists?**
A: The script will update the existing user document in Firestore. You can safely re-run it.

**Q: Can I change these passwords?**
A: Yes! In Firebase Console → Authentication, you can edit any user's password anytime.

**Q: Why do I need two accounts?**
A: One for testing admin features, one for testing member features. They have different access levels.

**Q: What's stored in the user document?**
A: Email, display name, role, membership tier, account status, and profile completion flag.

---

## 🔒 Security Notes

Before deploying to production:
1. ⚠️ Change all test account passwords
2. 🔐 Never commit `firebase-admin-key.json` to Git
3. 📧 Create a real admin account for the platform owner
4. 🛡️ Enable two-factor authentication for admin accounts
5. ⚙️ Set up Firebase Security Rules to enforce role-based access

---

## 📝 Files Created

- `scripts/setup-auth.mjs` - Automated setup script
- `SETUP_AUTH.md` - Detailed setup instructions
- `CREDENTIALS.md` - Quick reference card

**To run setup again:** `node scripts/setup-auth.mjs`
