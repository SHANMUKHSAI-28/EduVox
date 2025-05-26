// Fix user subscription data to include missing usage fields
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from './src/firebaseConfig.js';

const userId = 'jpdmrevw4jX86fsSAteg6Ia22Mk2'; // Current user ID from logs

async function fixUserSubscription() {
  try {
    console.log('🔧 Fixing user subscription data...');
    
    const subscriptionRef = doc(db, 'userSubscriptions', userId);
    const subscriptionDoc = await getDoc(subscriptionRef);
    
    if (subscriptionDoc.exists()) {
      const currentData = subscriptionDoc.data();
      console.log('📄 Current subscription data:', currentData);
      
      // Update with missing usage fields
      const updatedUsage = {
        pathwaysGenerated: currentData.usage?.pathwaysGenerated || 1, // Keep existing count
        uniGuideProUsage: currentData.usage?.uniGuideProUsage || 0, // Reset UniGuidePro usage
        myStudyPathUsage: currentData.usage?.myStudyPathUsage || 0, // Reset MyStudyPath usage
        universityComparisons: currentData.usage?.universityComparisons || 0,
        pdfExports: currentData.usage?.pdfExports || 0
      };
      
      await updateDoc(subscriptionRef, {
        'usage': updatedUsage,
        'planType': 'free', // Ensure planType is set
        'updatedAt': new Date()
      });
      
      console.log('✅ User subscription updated with correct structure');
      console.log('📊 New usage data:', updatedUsage);
    } else {
      console.log('❌ Subscription document not found');
    }
  } catch (error) {
    console.error('Error fixing subscription:', error);
  }
}

fixUserSubscription();
