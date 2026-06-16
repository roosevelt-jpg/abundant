# 🔐 ABUNDANT GLOBAL CLUB - TEST CREDENTIALS

## Quick Reference

### Admin Dashboard
- **Email:** `admin@abundant.club`
- **Password:** `Admin@123456`
- **URL:** http://localhost:3000/admin
- **Access:** Full platform management, user management, event creation, testimonial approval, billing

### Member Dashboard
- **Email:** `member@abundant.club`
- **Password:** `Member@123456`
- **URL:** http://localhost:3000/dashboard
- **Access:** Profile, events, testimonials, memberships, community

---

## Setup Instructions

### 1️⃣ Get Firebase Service Account Key
```
Firebase Console → Settings → Service Accounts → Generate New Private Key
Save as: firebase-admin-key.json
```

### 2️⃣ Run Setup Script
```bash
node scripts/setup-auth.mjs
```

### 3️⃣ Login & Test
- Go to http://localhost:3000/login
- Use credentials above
- Navigate to respective dashboards

---

## Navigation Flows

### For Admins (admin@abundant.club)
1. Login at `/login`
2. Redirected to `/admin`
3. Manage:
   - Members (`/admin/members`)
   - Events (`/admin/events`)
   - Testimonials (`/admin/testimonials`)
   - Pages (`/admin/pages`)
   - Settings (`/admin/settings`)
   - Billing (`/admin/billing`)

### For Members (member@abundant.club)
1. Login at `/login`
2. Redirected to `/dashboard`
3. Access:
   - Profile & Settings
   - Event Registration
   - Submit Testimonials
   - View Memberships
   - Community Directory

---

## Important Notes
- ⚠️ Change passwords before production
- 🔒 Keep `firebase-admin-key.json` private
- 📧 All test accounts have verified emails
- 🔄 Script creates/updates accounts as needed

---

## Support Resources
- Firebase Docs: https://firebase.google.com/docs
- Project Settings: `SETUP_AUTH.md` (full instructions)
- Troubleshooting: See `SETUP_AUTH.md`
