# Abundant Global Club - Authentication Setup Guide

## Quick Start

### Prerequisites
1. Firebase Project with Authentication enabled
2. Firestore Database created
3. Service Account Key from Firebase Console

### Step 1: Get Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your Abundant project
3. Click **Settings** ⚙️ → **Project Settings**
4. Go to **Service Accounts** tab
5. Click **Generate New Private Key**
6. Save the JSON file as `firebase-admin-key.json` in your project root

### Step 2: Run the Setup Script

```bash
cd /vercel/share/v0-project
node scripts/setup-auth.mjs
```

The script will create two test accounts automatically.

---

## Test Account Credentials

### Admin Dashboard Access
```
Email:    admin@abundant.club
Password: Admin@123456
```
**Access:** http://localhost:3000/admin

### Member Dashboard Access
```
Email:    member@abundant.club
Password: Member@123456
```
**Access:** http://localhost:3000/dashboard

---

## Manual Account Creation (Alternative)

If you prefer to create accounts manually through Firebase Console:

1. Go to Firebase Console → Authentication
2. Click **Create user**
3. Enter email and password
4. Create the Firestore user document:
   - Collection: `users`
   - Document ID: `{uid from auth}`
   - Fields:
     ```
     {
       uid: "{auth uid}",
       email: "{email}",
       displayName: "{name}",
       role: "admin" or "member",
       createdAt: {timestamp},
       status: "active",
       membershipTier: "admin" or "member",
       profileComplete: false
     }
     ```

---

## Role-Based Access

### Admin Role
- ✅ Access to `/admin/*` pages
- ✅ Full control over users, events, testimonials, settings
- ✅ Can manage memberships and approvals
- ✅ Access to billing and analytics

### Member Role
- ✅ Access to `/dashboard` pages
- ✅ Can submit testimonials
- ✅ Can register for events
- ✅ Can view and manage profile
- ❌ Cannot access admin pages

---

## Troubleshooting

### Script shows: "Firebase admin key not found"
- ✅ Download service account key from Firebase Console
- ✅ Save as `firebase-admin-key.json` in project root
- ✅ Re-run: `node scripts/setup-auth.mjs`

### Account already exists error
- The script checks for existing accounts and updates them
- To force recreate, delete the user from Firebase Console first

### Cannot access admin dashboard
- Verify user has `role: "admin"` in Firestore
- Check the `users/{uid}` document exists in Firestore
- Logout and login again

### Cannot access member dashboard
- Verify user has `role: "member"` in Firestore
- Ensure user is logged in before accessing `/dashboard`

---

## Application URLs

- **Home Page:** http://localhost:3000
- **Sign Up:** http://localhost:3000/signup
- **Login:** http://localhost:3000/login
- **Admin Dashboard:** http://localhost:3000/admin
- **Member Dashboard:** http://localhost:3000/dashboard
- **Events:** http://localhost:3000/events
- **Pricing:** http://localhost:3000/pricing

---

## Next Steps

1. ✅ Create test accounts using the setup script
2. ✅ Test admin features at `/admin`
3. ✅ Test member features at `/dashboard`
4. 📝 Create real admin account for production
5. 🔐 Change all test account passwords before going live
6. 🚀 Deploy to production

---

## Security Notes

- **IMPORTANT:** Change all test passwords before production deployment
- Service account key should never be committed to Git
- Add `firebase-admin-key.json` to `.gitignore`
- Use environment variables for production credentials
- Implement proper password requirements for real users
- Enable two-factor authentication for admin accounts
