# Deployment Guide for Abundant Global Club

## Current Status
- **Repository:** https://github.com/roosevelt-jpg/abundant
- **Branch:** abundant-global-club
- **Custom Domain:** abundantglobalclub.com
- **Platform:** Vercel

## Pre-Deployment Checklist

### 1. Vercel Project Configuration
- [ ] Project is connected to GitHub repository
- [ ] Custom domain (abundantglobalclub.com) is added in Vercel
- [ ] Domain DNS records are updated (check Vercel dashboard for required records)
- [ ] SSL certificate is auto-provisioned (automatic with Vercel)

### 2. Environment Variables
Make sure all these are set in Vercel Project Settings → Environment Variables:

```
NEXT_PUBLIC_FIREBASE_API_KEY=<your_key>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<your_domain>
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<your_project_id>
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<your_bucket>
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<your_sender_id>
NEXT_PUBLIC_FIREBASE_APP_ID=<your_app_id>
```

### 3. Firebase Configuration
- [ ] Firebase project is set up
- [ ] Firestore Database is created and rules are set
- [ ] Firebase Storage bucket is configured
- [ ] Authentication methods enabled (Email/Password)

### 4. Code Quality
- [ ] All TypeScript errors resolved (if any)
- [ ] No console errors in development
- [ ] All API routes tested locally
- [ ] Authentication flow tested locally

## Deployment Steps

### Step 1: Verify Vercel Connection
1. Go to https://vercel.com/dashboard
2. Find your "Abundant Global Club" project
3. Confirm the GitHub repository is connected: `roosevelt-jpg/abundant`
4. Verify branch is set to: `abundant-global-club`

### Step 2: Add Custom Domain
1. In Vercel Dashboard → Project Settings → Domains
2. Add `abundantglobalclub.com`
3. Follow the DNS configuration instructions
4. Wait for DNS propagation (can take 24-48 hours)

### Step 3: Configure Environment Variables
1. Go to Project Settings → Environment Variables
2. Add all Firebase credentials (see Pre-Deployment Checklist above)
3. Select environments: Production, Preview, Development
4. Save changes (automatic redeploy for existing deployments)

### Step 4: Deploy
**Automatic Deployment:**
- Push to `abundant-global-club` branch
- Vercel automatically builds and deploys

**Manual Deployment:**
1. In Vercel Dashboard, go to the project
2. Click "Deployments" tab
3. Find the latest deployment
4. Click the three dots → "Promote to Production"

### Step 5: Verify Deployment
1. Visit https://abundantglobalclub.com
2. Check homepage loads correctly
3. Test authentication flow:
   - Go to /login
   - Test with admin credentials (if available)
   - Check admin dashboard loads
4. Verify Firebase connectivity:
   - Check browser console for Firebase errors
   - Test page that reads from Firestore

## Post-Deployment Verification

### Frontend Checks
- [ ] Homepage loads and renders correctly
- [ ] Navigation works across all pages
- [ ] Images load without CORS errors
- [ ] Theme toggle works (dark/light mode)
- [ ] Language switcher works (English/Arabic)
- [ ] Responsive design works on mobile

### Backend Checks
- [ ] Firebase Authentication works
- [ ] Firestore database syncs data
- [ ] API routes respond correctly
- [ ] No 404 errors for static assets
- [ ] No CORS errors in console

### Security Checks
- [ ] SSL certificate is valid
- [ ] Security headers are present
- [ ] No sensitive data in environment
- [ ] Firebase security rules are enforced

## Troubleshooting

### Domain Not Pointing to Vercel
- [ ] Check DNS records in your domain provider (usually GoDaddy, Namecheap, etc.)
- [ ] Vercel will show required DNS records in Project Settings → Domains
- [ ] Allow 24-48 hours for DNS propagation
- [ ] Use `dig abundantglobalclub.com` or online DNS checker to verify

### Build Failing
- [ ] Check build logs in Vercel Dashboard → Deployments
- [ ] Ensure all environment variables are set
- [ ] Verify package.json has all required dependencies
- [ ] Check for TypeScript errors: `pnpm type-check`

### Firebase Not Working
- [ ] Verify environment variables are correctly set
- [ ] Check Firebase security rules allow read/write
- [ ] Ensure Firebase project is active
- [ ] Check browser console for Firebase errors
- [ ] Verify CORS settings if making API calls from frontend

### Pages Not Loading
- [ ] Check Vercel build logs for errors
- [ ] Verify all imports and paths are correct
- [ ] Check that middleware (if any) is not blocking requests
- [ ] Clear browser cache and do hard refresh

## Useful Links

- **Vercel Dashboard:** https://vercel.com/dashboard
- **GitHub Repository:** https://github.com/roosevelt-jpg/abundant
- **Firebase Console:** https://console.firebase.google.com
- **Custom Domain:** abundantglobalclub.com

## Performance Optimization

The following optimizations are already in place:
- Next.js image optimization enabled
- SWC minification for faster builds
- Automatic code splitting
- Tailwind CSS purging for smaller bundle
- Server-side rendering where appropriate

## Monitoring

After deployment, monitor:
1. **Vercel Analytics Dashboard** - Check traffic and performance
2. **Firebase Console** - Monitor usage and costs
3. **Web Vitals** - Check Core Web Vitals scores
4. **Error Tracking** - Set up error monitoring (optional)

## Support

If you encounter issues during deployment:
1. Check Vercel logs: Dashboard → Deployments → Click deployment → Logs
2. Check browser console for errors (F12 → Console tab)
3. Verify Firebase is accessible: https://console.firebase.google.com
4. Contact Vercel support: https://vercel.com/help

---

**Last Updated:** June 16, 2026
**Platform Version:** Next.js 16 + React 19.2
**Status:** Ready for Production Deployment
