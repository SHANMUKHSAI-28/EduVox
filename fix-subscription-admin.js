// Fix user subscription data using Firebase Admin SDK
import admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
  // You can use service account or initialize with default credentials
  // For local development, you might need to set GOOGLE_APPLICATION_CREDENTIALS
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: "https://eduvox-56b6a-default-rtdb.firebaseio.com"
  });
}

const db = admin.firestore();
const userId = 'jpdmrevw4jX86fsSAteg6Ia22Mk2'; // Current user ID from logs

async function fixUserSubscription() {
  try {
    console.log('🔧 Fixing user subscription data...');
    
    const subscriptionRef = db.collection('userSubscriptions').doc(userId);
    const subscriptionDoc = await subscriptionRef.get();
    
    if (subscriptionDoc.exists) {
      const currentData = subscriptionDoc.data();
      console.log('📄 Current subscription data:', JSON.stringify(currentData, null, 2));
      
      // Update with missing usage fields
      const updatedUsage = {
        pathwaysGenerated: currentData.usage?.pathwaysGenerated || 1, // Keep existing count
        uniGuideProUsage: currentData.usage?.uniGuideProUsage || 0, // Reset UniGuidePro usage
        myStudyPathUsage: currentData.usage?.myStudyPathUsage || 0, // Reset MyStudyPath usage
        universityComparisons: currentData.usage?.universityComparisons || 0,
        pdfExports: currentData.usage?.pdfExports || 0
      };
      
      await subscriptionRef.update({
        'usage': updatedUsage,
        'planType': 'free', // Ensure planType is set
        'updatedAt': admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log('✅ User subscription updated with correct structure');
      console.log('📊 New usage data:', updatedUsage);
    } else {
      console.log('❌ Subscription document not found');
      
      // Create a new subscription document with correct structure
      const newSubscriptionData = {
        planType: 'free',
        usage: {
          pathwaysGenerated: 0,
          uniGuideProUsage: 0,
          myStudyPathUsage: 0,
          universityComparisons: 0,
          pdfExports: 0
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      await subscriptionRef.set(newSubscriptionData);
      console.log('✅ Created new subscription document');
    }
  } catch (error) {
    console.error('❌ Error fixing subscription:', error);
  } finally {
    // Close the app
    process.exit(0);
  }
}

fixUserSubscription();
