const FIREBASE_API_KEY = 'AIzaSyCZ3aASRzQYC2jWHiggzRJRaDYfWYFDZpc';
const FIREBASE_PROJECT_ID = 'abundantglobalclub';

async function createAdminUser() {
  try {
    console.log('[v0] Creating admin user via Firebase REST API...');
    
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'admin@abundantglobalclub.com',
          password: 'Admin@Abundant123!',
          returnSecureToken: true,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      if (data.error?.message === 'EMAIL_EXISTS') {
        console.log('[v0] Admin user already exists. Updating password...');
        
        // Sign in to get ID token
        const signInResponse = await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: 'admin@abundantglobalclub.com',
              password: 'Admin@Abundant123!',
              returnSecureToken: true,
            }),
          }
        );

        const signInData = await signInResponse.json();
        if (signInResponse.ok) {
          console.log('[v0] Admin user found and verified');
        }
      } else {
        throw new Error(data.error?.message || 'Unknown error');
      }
    } else {
      console.log('[v0] Successfully created admin user:', data.localId);
    }

    console.log('\n✅ Admin Account Ready!\n');
    console.log('Email: admin@abundantglobalclub.com');
    console.log('Password: Admin@Abundant123!');
    console.log('\nLogin at: https://www.abundantglobalclub.com/admin');
    console.log('Or: https://www.abundantglobalclub.com/login\n');

  } catch (error) {
    console.error('[v0] Error:', error.message);
    process.exit(1);
  }
}

createAdminUser().then(() => {
  process.exit(0);
});
