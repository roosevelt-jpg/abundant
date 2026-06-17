const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase using GOOGLE_APPLICATION_CREDENTIALS or service account
// This will use the environment variables automatically
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');

if (!serviceAccount.project_id) {
  console.error('[v0] Error: FIREBASE_SERVICE_ACCOUNT environment variable not set');
  process.exit(1);
}

const app = initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore(app);

async function setAdminRole(email) {
  try {
    console.log(`[v0] Setting admin role for: ${email}`);
    
    // Query for user by email
    const usersRef = db.collection('users');
    const query = usersRef.where('email', '==', email);
    const snapshot = await query.get();
    
    if (snapshot.empty) {
      console.error(`[v0] User not found: ${email}`);
      process.exit(1);
    }
    
    const userDoc = snapshot.docs[0];
    console.log(`[v0] Found user: ${userDoc.id}`);
    
    // Update role to admin
    await userDoc.ref.update({
      role: 'admin',
      updatedAt: new Date(),
    });
    
    console.log(`[v0] Successfully set admin role for: ${email}`);
    process.exit(0);
  } catch (error) {
    console.error('[v0] Error:', error.message);
    process.exit(1);
  }
}

// Get email from command line argument
const email = process.argv[2] || 'amara@abundantglobalclub.com';
setAdminRole(email);
