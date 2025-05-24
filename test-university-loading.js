// Quick test script to check university loading
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, limit } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDZuVIb6mSZYqKAp3LnKm8qTyE9DhAo-_8",
  authDomain: "eduvox-a5f31.firebaseapp.com",
  projectId: "eduvox-a5f31",
  storageBucket: "eduvox-a5f31.firebasestorage.app",
  messagingSenderId: "862244593088",
  appId: "1:862244593088:web:c8f6e2c2b5c8e1c2f3e4d5"
};

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
