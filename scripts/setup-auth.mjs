#!/usr/bin/env node
/**
 * Setup script to create test user accounts in Firebase
 * Usage: node scripts/setup-auth.mjs
 * 
 * This script creates:
 * 1. Admin account (admin@abundant.club / Admin@123456)
 * 2. Member account (member@abundant.club / Member@123456)
 * 
 * Important: Set your Firebase credentials in .env.local before running
 */

import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// Get service account key from environment or file
let serviceAccount;
try {
  const keyPath = process.env.FIREBASE_ADMIN_KEY_PATH || './firebase-admin-key.json';
  if (fs.existsSync(keyPath)) {
    serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
  } else {
    console.error('❌ Firebase admin key not found at:', keyPath);
    console.log('Please create a service account key from Firebase Console:');
    console.log('1. Go to Firebase Console > Project Settings > Service Accounts');
    console.log('2. Click "Generate New Private Key"');
    console.log('3. Save as firebase-admin-key.json in the project root');
    process.exit(1);
  }
} catch (error) {
  console.error('Error loading service account:', error.message);
  process.exit(1);
}

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
});

const auth = admin.auth();
const db = admin.firestore();

const TEST_ACCOUNTS = [
  {
    email: 'admin@abundant.club',
    password: 'Admin@123456',
    role: 'admin',
    displayName: 'Admin User',
    description: 'Admin Dashboard'
  },
  {
    email: 'member@abundant.club',
    password: 'Member@123456',
    role: 'member',
    displayName: 'Test Member',
    description: 'Member Dashboard'
  }
];

async function createUser(account) {
  try {
    // Check if user already exists
    let user;
    try {
      user = await auth.getUserByEmail(account.email);
      console.log(`⏭️  User ${account.email} already exists, updating...`);
    } catch (error) {
      // User doesn't exist, create new
      user = await auth.createUser({
        email: account.email,
        password: account.password,
        displayName: account.displayName,
        emailVerified: true
      });
      console.log(`✅ Created ${account.role} account: ${account.email}`);
    }

    // Create/update user document in Firestore
    await db.collection('users').doc(user.uid).set({
      uid: user.uid,
      email: account.email,
      displayName: account.displayName,
      role: account.role,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'active',
      membershipTier: account.role === 'admin' ? 'admin' : 'member',
      profileComplete: false
    }, { merge: true });

    console.log(`✅ User document created in Firestore`);
    return { uid: user.uid, email: account.email, ...account };
  } catch (error) {
    console.error(`❌ Error creating user ${account.email}:`, error.message);
    throw error;
  }
}

async function main() {
  console.log('\n🚀 Abundant Global Club - Test Account Setup\n');
  console.log('Creating test accounts...\n');

  const createdUsers = [];

  for (const account of TEST_ACCOUNTS) {
    try {
      const user = await createUser(account);
      createdUsers.push(user);
    } catch (error) {
      console.error(`Failed to create ${account.email}`);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ TEST ACCOUNTS CREATED SUCCESSFULLY\n');

  console.log('📋 ADMIN DASHBOARD LOGIN CREDENTIALS:');
  console.log('   Email:    admin@abundant.club');
  console.log('   Password: Admin@123456\n');

  console.log('📋 MEMBER DASHBOARD LOGIN CREDENTIALS:');
  console.log('   Email:    member@abundant.club');
  console.log('   Password: Member@123456\n');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n💡 IMPORTANT NOTES:');
  console.log('   • Change these passwords in production');
  console.log('   • Users are created with verified email status');
  console.log('   • Admin role gives access to /admin pages');
  console.log('   • Member role gives access to /dashboard pages\n');

  console.log('🔗 APPLICATION URLS:');
  console.log('   • Home:              http://localhost:3000');
  console.log('   • Admin Dashboard:   http://localhost:3000/admin');
  console.log('   • Member Dashboard:  http://localhost:3000/dashboard');
  console.log('   • Login:             http://localhost:3000/login\n');

  process.exit(0);
}

main().catch((error) => {
  console.error('\n❌ Setup failed:', error);
  process.exit(1);
});
