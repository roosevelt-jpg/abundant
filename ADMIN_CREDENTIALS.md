# Abundant Global Club - Admin Login Credentials

## Admin Dashboard Access

### Primary Admin Account
- **Email**: admin@abundantglobalclub.com
- **Password**: Admin@Abundant123!
- **Role**: Super Admin
- **Access**: Full access to all dashboard features

### Admin Dashboard URL
- **Local Development**: http://localhost:3000/admin
- **Production**: https://www.abundantglobalclub.com/admin

## Dashboard Features

Once logged in, admins can:
- Manage membership tiers
- Approve/reject testimonials
- Create and manage events
- View member profiles
- Update website pages
- Configure platform settings
- Manage billing and subscriptions
- Access analytics and reports

## Member Test Accounts

### Member Account
- **Email**: member@abundantglobalclub.com
- **Password**: Member@Abundant123!
- **Role**: Member
- **Access**: Member dashboard and community features

### Elite Member Account
- **Email**: elite@abundantglobalclub.com
- **Password**: Elite@Abundant123!
- **Role**: Elite Member
- **Access**: Elite member dashboard with priority support

## Important Notes

1. **First Time Login**: You may need to verify your email or set up 2FA depending on security settings
2. **Password Reset**: Available on the login page if needed
3. **Forgot Password**: Click "Forgot Password" on login page to reset
4. **Admin Settings**: Go to Admin Dashboard → Settings to configure authentication methods

## Database Setup

If setting up from scratch, run:
```bash
node scripts/setup-auth.mjs
```

This will create the admin account and test member accounts in Firebase Authentication.

## Security Best Practices

- Change default passwords immediately after first login
- Never share admin credentials
- Use strong, unique passwords
- Enable 2FA if available
- Regularly monitor admin activity logs
- Keep credentials in a secure password manager

## Support

For issues accessing the admin dashboard or resetting credentials, check:
1. Firebase Console → Authentication settings
2. Vercel environment variables (NEXT_PUBLIC_FIREBASE_* keys)
3. Browser console for specific error messages
4. Server logs for backend errors

---

**Last Updated**: June 17, 2026
**Project**: Abundant Global Club
**Environment**: Production Ready
