import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

class SubscriptionService {
  constructor() {
    this.subscriptionsCollection = 'subscriptions';
    this.plansCollection = 'subscriptionPlans';
    this.transactionsCollection = 'subscriptionTransactions';
    
    // Subscription tiers configuration
    this.subscriptionTiers = {
      free: {
        id: 'free',
        name: 'Free',
        price: 0,
        currency: 'INR',
        duration: 'lifetime',
        features: {
          universityBrowsing: true,
          universityComparison: 3, // Max 3 universities
          pathwayGeneration: 1, // 1 pathway per month
          pdfExports: false,
          prioritySupport: false,
          advancedFilters: false,
          scholarshipAlerts: false,
          applicationTracking: false,
          analyticsReports: false
        },        limits: {          pathwaysPerMonth: 1,
          uniGuideProUsage: 3, // 3 free UniGuidePro uses per month
          myStudyPathUsage: 0, // MyStudyPath requires paid plan
          universityComparisons: 3, // 3 university comparisons (renamed from universitiesComparison)
          pdfExports: 0,
          savedUniversities: 10
        }
      },
      premium: {
        id: 'premium',
        name: 'Premium',
        price: 999,
        currency: 'INR',
        duration: 'monthly',
        features: {
          universityBrowsing: true,
          universityComparison: 10,
          pathwayGeneration: 'unlimited',
          pdfExports: true,
          prioritySupport: false,
          advancedFilters: true,
          scholarshipAlerts: true,
          applicationTracking: true,
          analyticsReports: false
        },        limits: {
          pathwaysPerMonth: -1, // Unlimited
          uniGuideProUsage: -1, // Unlimited UniGuidePro usage
          myStudyPathUsage: -1, // Unlimited MyStudyPath usage
          universityComparisons: 10, // 10 university comparisons (renamed from universitiesComparison)
          pdfExports: -1, // Unlimited
          savedUniversities: 50
        }
      },
      pro: {
        id: 'pro',
        name: 'Professional',
        price: 1999,
        currency: 'INR',
        duration: 'monthly',
        features: {
          universityBrowsing: true,
          universityComparison: 'unlimited',
          pathwayGeneration: 'unlimited',
          pdfExports: true,
          prioritySupport: true,
          advancedFilters: true,
          scholarshipAlerts: true,
          applicationTracking: true,
          analyticsReports: true
        },        limits: {
          pathwaysPerMonth: -1, // Unlimited
          uniGuideProUsage: -1, // Unlimited UniGuidePro usage
          myStudyPathUsage: -1, // Unlimited MyStudyPath usage
          universityComparisons: -1, // Unlimited (renamed from universitiesComparison)
          pdfExports: -1, // Unlimited
          savedUniversities: -1 // Unlimited
        }
      }
    };
  }

  /**
   * Initialize subscription plans in Firestore
   */
  async initializeSubscriptionPlans() {
    try {
      for (const [planId, planData] of Object.entries(this.subscriptionTiers)) {
        const planRef = doc(db, this.plansCollection, planId);
        await setDoc(planRef, {
          ...planData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          active: true
        });
      }
      return { success: true, message: 'Subscription plans initialized successfully' };
    } catch (error) {
      console.error('Error initializing subscription plans:', error);
      throw new Error('Failed to initialize subscription plans');
    }
  }

  /**
   * Get all available subscription plans
   */
  async getSubscriptionPlans() {
    try {
      return this.subscriptionTiers;
    } catch (error) {
      console.error('Error getting subscription plans:', error);
      throw new Error('Failed to get subscription plans');
    }
  }

  /**
   * Get user's current subscription
   */  async getUserSubscription(userId) {
    try {
      const subscriptionRef = doc(db, this.subscriptionsCollection, userId);
      const subscriptionDoc = await getDoc(subscriptionRef);
      
      if (subscriptionDoc.exists()) {
        const subscriptionData = subscriptionDoc.data();
        
        // Check if subscription is still active
        if (subscriptionData.status === 'active' && subscriptionData.expiresAt) {
          const now = new Date();
          const expiresAt = subscriptionData.expiresAt.toDate();
          
          if (now > expiresAt) {
            // Subscription expired, downgrade to free
            await this.downgradeToFree(userId);
            // Return free tier with proper structure
            return {
              ...this.subscriptionTiers.free,
              planType: 'free',
              planId: 'free',
              status: 'active',
              usage: {
                pathwaysGenerated: 0,
                uniGuideProUsage: 0,
                myStudyPathUsage: 0,
                universityComparisons: 0,
                pdfExports: 0
              }
            };
          }
        }
        
        // Return active subscription with proper structure
        return {
          ...this.subscriptionTiers[subscriptionData.planId],
          ...subscriptionData,
          planType: subscriptionData.planType || subscriptionData.planId
        };
      } else {
        // No subscription found, create free tier subscription
        const newSubscription = await this.createFreeSubscription(userId);
        return {
          ...this.subscriptionTiers.free,
          ...newSubscription,
          planType: 'free'
        };
      }
    } catch (error) {
      console.error('Error getting user subscription:', error);
      // Return free tier with proper structure even on error
      return {
        ...this.subscriptionTiers.free,
        planType: 'free',
        planId: 'free',
        status: 'active',
        usage: {
          pathwaysGenerated: 0,
          uniGuideProUsage: 0,
          myStudyPathUsage: 0,
          universityComparisons: 0,
          pdfExports: 0
        }
      };
    }
  }

  /**
   * Create free tier subscription for new users
   */
  async createFreeSubscription(userId) {
    try {      const subscriptionData = {
        userId,
        planId: 'free',
        planType: 'free',
        status: 'active',
        startDate: serverTimestamp(),
        expiresAt: null, // Free tier never expires
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        usage: {
          pathwaysGenerated: 0,
          uniGuideProUsage: 0, // Start with 0 used, so they have all 3 available
          myStudyPathUsage: 0,
          universityComparisons: 0,
          pdfExports: 0
        }
      };

      const subscriptionRef = doc(db, this.subscriptionsCollection, userId);
      await setDoc(subscriptionRef, subscriptionData);
      
      return subscriptionData;
    } catch (error) {
      console.error('Error creating free subscription:', error);
      throw new Error('Failed to create free subscription');
    }
  }
  /**
   * Upgrade user subscription
   */
  async upgradeSubscription(userId, planId, paymentData) {
    try {
      const plan = this.subscriptionTiers[planId];
      if (!plan) {
        throw new Error('Invalid subscription plan');
      }

      const now = new Date();
      const expiresAt = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days from now

      const subscriptionData = {
        userId,
        planId,
        planType: planId,
        status: 'active',
        startDate: serverTimestamp(),
        expiresAt: expiresAt,
        updatedAt: serverTimestamp(),
        paymentData: {
          transactionId: paymentData.transactionId,
          amount: plan.price,
          currency: plan.currency,
          paymentMethod: paymentData.paymentMethod,
          razorpayOrderId: paymentData.razorpayOrderId,
          razorpayPaymentId: paymentData.razorpayPaymentId
        },
        usage: {
          pathwaysGenerated: 0,
          uniGuideProUsage: 0,
          myStudyPathUsage: 0,
          universityComparisons: 0,
          pdfExports: 0
        }
      };

      const subscriptionRef = doc(db, this.subscriptionsCollection, userId);
      await setDoc(subscriptionRef, subscriptionData);

      // Record transaction
      await this.recordTransaction(userId, planId, paymentData);

      return {
        success: true,
        message: `Successfully upgraded to ${plan.name} plan`,
        subscription: subscriptionData
      };
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      throw new Error('Failed to upgrade subscription');
    }
  }

  /**
   * Downgrade user to free tier
   */
  async downgradeToFree(userId) {
    try {
      const subscriptionRef = doc(db, this.subscriptionsCollection, userId);      await updateDoc(subscriptionRef, {
        planId: 'free',
        planType: 'free',
        status: 'active',
        expiresAt: null,
        updatedAt: serverTimestamp(),
        usage: {
          pathwaysGenerated: 0,
          uniGuideProUsage: 0,
          myStudyPathUsage: 0,
          universityComparisons: 0,
          pdfExports: 0
        }
      });

      return { success: true, message: 'Downgraded to free tier' };
    } catch (error) {
      console.error('Error downgrading subscription:', error);
      throw new Error('Failed to downgrade subscription');
    }
  }

  /**
   * Check if user can perform an action based on their subscription
   */
  async checkUsageLimit(userId, action) {
    try {
      const subscription = await this.getUserSubscription(userId);
      const plan = this.subscriptionTiers[subscription.planId];
      
      if (!plan) {
        return { allowed: false, reason: 'Invalid subscription plan' };
      }

      // Get current usage stats
      const subscriptionRef = doc(db, this.subscriptionsCollection, userId);
      const subscriptionDoc = await getDoc(subscriptionRef);
      let usageStats = { pathwaysGenerated: 0, pdfExports: 0, lastReset: new Date() };
      
      if (subscriptionDoc.exists()) {
        usageStats = subscriptionDoc.data().usageStats || usageStats;
        
        // Check if usage should be reset (monthly reset)
        const lastReset = usageStats.lastReset.toDate();
        const now = new Date();
        const monthDiff = (now.getFullYear() - lastReset.getFullYear()) * 12 + now.getMonth() - lastReset.getMonth();
        
        if (monthDiff >= 1) {
          // Reset monthly usage
          usageStats = {
            pathwaysGenerated: 0,
            pdfExports: 0,
            lastReset: serverTimestamp()
          };
          
          await updateDoc(subscriptionRef, { usageStats });
        }
      }

      switch (action) {
        case 'pathway_generation':
          if (plan.limits.pathwaysPerMonth === -1) {
            return { allowed: true };
          }
          if (usageStats.pathwaysGenerated >= plan.limits.pathwaysPerMonth) {
            return { 
              allowed: false, 
              reason: `Monthly pathway limit (${plan.limits.pathwaysPerMonth}) reached. Upgrade to generate more pathways.` 
            };
          }
          return { allowed: true };

        case 'pdf_export':
          if (!plan.features.pdfExports) {
            return { 
              allowed: false, 
              reason: 'PDF exports are not available in your current plan. Upgrade to Premium or Pro.' 
            };
          }
          if (plan.limits.pdfExports === -1) {
            return { allowed: true };
          }
          if (usageStats.pdfExports >= plan.limits.pdfExports) {
            return { 
              allowed: false, 
              reason: `Monthly PDF export limit (${plan.limits.pdfExports}) reached. Upgrade to export more.` 
            };
          }
          return { allowed: true };

        case 'university_comparison':
          // This is checked in real-time in the UI based on current selection
          return { allowed: true };

        case 'advanced_filters':
          if (!plan.features.advancedFilters) {
            return { 
              allowed: false, 
              reason: 'Advanced filters are not available in your current plan. Upgrade to Premium or Pro.' 
            };
          }
          return { allowed: true };

        default:
          return { allowed: true };
      }
    } catch (error) {
      console.error('Error checking usage limit:', error);
      return { allowed: true }; // Allow on error to avoid blocking users
    }
  }

  /**
   * Record usage when user performs an action
   */
  async recordUsage(userId, action) {
    try {
      const subscriptionRef = doc(db, this.subscriptionsCollection, userId);
      const subscriptionDoc = await getDoc(subscriptionRef);
      
      if (subscriptionDoc.exists()) {
        const currentData = subscriptionDoc.data();
        const usageStats = currentData.usageStats || { pathwaysGenerated: 0, pdfExports: 0 };
        
        switch (action) {
          case 'pathway_generation':
            usageStats.pathwaysGenerated = (usageStats.pathwaysGenerated || 0) + 1;
            break;
          case 'pdf_export':
            usageStats.pdfExports = (usageStats.pdfExports || 0) + 1;
            break;
        }
        
        await updateDoc(subscriptionRef, { 
          usageStats,
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error recording usage:', error);
      // Don't throw error to avoid blocking user actions
    }
  }

  /**
   * Record payment transaction
   */
  async recordTransaction(userId, planId, paymentData) {
    try {
      const plan = this.subscriptionTiers[planId];
      const transactionData = {
        userId,
        planId,
        amount: plan.price,
        currency: plan.currency,
        status: 'completed',
        transactionId: paymentData.transactionId,
        razorpayOrderId: paymentData.razorpayOrderId,
        razorpayPaymentId: paymentData.razorpayPaymentId,
        paymentMethod: paymentData.paymentMethod,
        createdAt: serverTimestamp()
      };

      const transactionRef = doc(db, this.transactionsCollection, paymentData.transactionId);
      await setDoc(transactionRef, transactionData);
      
      return transactionData;
    } catch (error) {
      console.error('Error recording transaction:', error);
      throw new Error('Failed to record transaction');
    }
  }

  /**
   * Get user's transaction history
   */
  async getUserTransactions(userId) {
    try {
      const q = query(
        collection(db, this.transactionsCollection),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const transactions = [];
      
      querySnapshot.forEach((doc) => {
        transactions.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Sort by creation date (newest first)
      transactions.sort((a, b) => {
        const dateA = a.createdAt?.toDate() || new Date(0);
        const dateB = b.createdAt?.toDate() || new Date(0);
        return dateB - dateA;
      });
      
      return transactions;
    } catch (error) {
      console.error('Error getting user transactions:', error);
      return [];
    }
  }

  /**
   * Cancel subscription (downgrade to free at end of billing period)
   */
  async cancelSubscription(userId) {
    try {
      const subscriptionRef = doc(db, this.subscriptionsCollection, userId);
      await updateDoc(subscriptionRef, {
        status: 'cancelled',
        cancelledAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return { success: true, message: 'Subscription cancelled. You will be downgraded to free tier at the end of your billing period.' };
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw new Error('Failed to cancel subscription');
    }  }

  /**
   * Track usage for various actions
   */
  async trackUsage(userId, usageType) {
    try {
      const subscriptionRef = doc(db, this.subscriptionsCollection, userId);
      const subscriptionDoc = await getDoc(subscriptionRef);
      
      if (!subscriptionDoc.exists()) {
        await this.createFreeSubscription(userId);
      }
      
      const currentUsage = subscriptionDoc.exists() ? subscriptionDoc.data().usage || {} : {};
      const updatedUsage = {
        ...currentUsage,
        [usageType]: (currentUsage[usageType] || 0) + 1
      };
      
      await updateDoc(subscriptionRef, {
        usage: updatedUsage,
        updatedAt: serverTimestamp()
      });
      
      return true;
    } catch (error) {
      console.error(`Error tracking ${usageType} usage:`, error);
      return false;
    }
  }

  /**
   * Track pathway generation usage
   */
  async trackPathwayGeneration(userId) {
    return await this.trackUsage(userId, 'pathwaysGenerated');
  }

  /**
   * Track UniGuidePro usage
   */
  async trackUniGuideProUsage(userId) {
    return await this.trackUsage(userId, 'uniGuideProUsage');
  }

  /**
   * Track MyStudyPath usage
   */
  async trackMyStudyPathUsage(userId) {
    return await this.trackUsage(userId, 'myStudyPathUsage');
  }

  /**
   * Track university comparison usage
   */
  async trackUniversityComparison(userId) {
    return await this.trackUsage(userId, 'universityComparisons');
  }

  /**
   * Track PDF export usage
   */
  async trackPdfExport(userId) {
    return await this.trackUsage(userId, 'pdfExports');
  }

  /**
   * Get subscription analytics for admin
   */
  async getSubscriptionAnalytics() {
    try {
      const subscriptionsQuery = query(collection(db, this.subscriptionsCollection));
      const subscriptionsSnapshot = await getDocs(subscriptionsQuery);
      
      const analytics = {
        totalSubscriptions: 0,
        activeSubscriptions: 0,
        planDistribution: { free: 0, premium: 0, pro: 0 },
        monthlyRevenue: 0,
        churnRate: 0
      };
      
      subscriptionsSnapshot.forEach((doc) => {
        const data = doc.data();
        analytics.totalSubscriptions++;
        
        if (data.status === 'active') {
          analytics.activeSubscriptions++;
          analytics.planDistribution[data.planId]++;
          
          if (data.planId !== 'free') {
            const plan = this.subscriptionTiers[data.planId];
            analytics.monthlyRevenue += plan.price;
          }
        }
      });
      
      return analytics;
    } catch (error) {
      console.error('Error getting subscription analytics:', error);
      return null;
    }
  }
}

export default new SubscriptionService();
