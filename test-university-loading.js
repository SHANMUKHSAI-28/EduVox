// Quick test script to check university loading
import dotenv from 'dotenv';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, limit } from 'firebase/firestore';

// Load environment variables
dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Validate required environment variables
const requiredEnvVars = ['VITE_FIREBASE_API_KEY', 'VITE_FIREBASE_AUTH_DOMAIN', 'VITE_FIREBASE_PROJECT_ID'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  console.error('Please check your .env file and ensure all Firebase configuration variables are set.');
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testUniversityLoading() {
  console.log('🔍 Testing university loading...');
  
  try {
    // Get first 10 universities
    const q = query(collection(db, 'universities'), limit(10));
    const snapshot = await getDocs(q);
    
    console.log(`📊 Found ${snapshot.size} universities in database`);
    
    if (snapshot.empty) {
      console.log('❌ No universities found in database');
      return;
    }
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`📚 ${data.name} (${data.country})`);
      console.log(`   - isVerified: ${data.isVerified}`);
      console.log(`   - admin_approved: ${data.admin_approved}`);
      console.log(`   - type: ${data.type}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error testing university loading:', error);
  }
}

testUniversityLoading();
