// Razorpay Payment Service for EduVox Subscription Management
import subscriptionService from './subscriptionService';

class PaymentService {  constructor() {
    // Use the actual keys directly
    this.razorpayKeyId = "rzp_live_CpIJMtnnaKTRht";
    this.razorpayKeySecret = "j4Kzhi78U6Wq1BoZIBsR8b8G";
  }

  // Load Razorpay script dynamically
  loadRazorpayScript() {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  // Create Razorpay order
  async createOrder(planType, userId) {
    try {
      const planDetails = this.getPlanDetails(planType);
      
      // In a real app, this would call your backend API to create a Razorpay order
      const orderData = {
        amount: planDetails.price * 100, // Razorpay expects amount in paise
        currency: 'INR',
        receipt: `subscription_${userId}_${Date.now()}`,
        notes: {
          userId,
          planType,
          subscriptionType: 'monthly'
        }
      };

      // Mock order creation - replace with actual API call
      const order = {
        id: `order_${Date.now()}`,
        ...orderData
      };

      return order;
    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      throw error;
    }
  }

  // Get plan details
  getPlanDetails(planType) {
    const plans = {
      premium: {
        price: 999,
        name: 'Premium Plan',
        description: 'Unlimited pathways, 10 university comparisons, unlimited PDF exports'
      },
      pro: {
        price: 1999,
        name: 'Pro Plan',
        description: 'Unlimited everything plus analytics and priority support'
      }
    };

    return plans[planType] || null;
  }

  // Process subscription payment
  async processSubscriptionPayment(planType, userId, userEmail, userName) {
    try {
      // Load Razorpay script
      const isLoaded = await this.loadRazorpayScript();
      if (!isLoaded) {
        throw new Error('Failed to load Razorpay script');
      }

      // Create order
      const order = await this.createOrder(planType, userId);
      const planDetails = this.getPlanDetails(planType);

      // Razorpay payment options
      const options = {
        key: this.razorpayKeyId,
        amount: order.amount,
        currency: order.currency,
        name: 'EduVox',
        description: planDetails.description,
        image: '/logo192.png', // Your app logo
        order_id: order.id,
        prefill: {
          name: userName,
          email: userEmail,
        },
        theme: {
          color: '#3b82f6'
        },
        modal: {
          ondismiss: () => {
            console.log('Payment cancelled by user');
          }
        },
        handler: async (response) => {
          await this.handlePaymentSuccess(response, planType, userId);
        }
      };

      // Open Razorpay checkout
      const razorpay = new window.Razorpay(options);
      razorpay.open();

      return new Promise((resolve, reject) => {
        razorpay.on('payment.failed', (response) => {
          console.error('Payment failed:', response.error);
          reject(response.error);
        });

        // Set up success handler
        const originalHandler = options.handler;
        options.handler = async (response) => {
          try {
            await originalHandler(response);
            resolve(response);
          } catch (error) {
            reject(error);
          }
        };
      });

    } catch (error) {
      console.error('Error processing payment:', error);
      throw error;
    }
  }

  // Handle successful payment
  async handlePaymentSuccess(paymentResponse, planType, userId) {
    try {
      const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = paymentResponse;

      // Verify payment signature (in production, do this on your backend)
      const isValidSignature = await this.verifyPaymentSignature(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      );

      if (!isValidSignature) {
        throw new Error('Invalid payment signature');
      }

      // Record payment in subscription service
      const planDetails = this.getPlanDetails(planType);
      await subscriptionService.recordPayment(userId, {
        amount: planDetails.price,
        planType,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        signature: razorpay_signature,
        method: 'razorpay'
      });

      // Upgrade subscription
      await subscriptionService.upgradeSubscription(userId, planType);

      console.log('Payment successful and subscription upgraded');
      return true;

    } catch (error) {
      console.error('Error handling payment success:', error);
      throw error;
    }
  }

  // Verify payment signature (simplified version)
  async verifyPaymentSignature(orderId, paymentId, signature) {
    // In production, this verification should be done on your secure backend
    // This is a simplified client-side verification for demo purposes
    try {
      const crypto = require('crypto');
      const generatedSignature = crypto
        .createHmac('sha256', this.razorpayKeySecret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      return generatedSignature === signature;
    } catch (error) {
      console.error('Error verifying signature:', error);
      return false;
    }
  }

  // Cancel subscription (for future use)
  async cancelSubscription(userId) {
    try {
      await subscriptionService.cancelSubscription(userId);
      return true;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }
  }

  // Get subscription plans for display
  getSubscriptionPlans() {
    return [      {
        type: 'free',
        name: 'Free',
        price: 0,
        features: [
          '5 uses of UniGuidePro per month',
          '1 study abroad pathway per month',
          '3 university comparisons',
          'Basic university search',
          'Community support'
        ],
        limitations: [
          'Limited UniGuidePro usage (5/month)',
          'No access to MyStudyPath',
          'No PDF exports',
          'Limited filter options',
          'Basic support only'
        ]
      },      {
        type: 'premium',
        name: 'Premium',
        price: 999,
        features: [
          '10 uses of UniGuidePro per month',
          'MyStudyPath access',
          'Unlimited study abroad pathways',
          '10 university comparisons per month',
          'Unlimited PDF exports',
          'Advanced search filters',
          'Email support'
        ],
        recommended: true
      },      {
        type: 'pro',
        name: 'Pro',
        price: 1999,
        features: [
          'Unlimited UniGuidePro usage',
          'MyStudyPath access',
          'Everything in Premium',
          'Unlimited university comparisons',
          'Advanced analytics dashboard',
          'Priority support',
          'Early access to new features',
          'Custom pathway recommendations'
        ]
      }
    ];
  }
}

export const paymentService = new PaymentService();
export default paymentService;
