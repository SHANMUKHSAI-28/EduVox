import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { paymentService } from '../../services/paymentService';
import subscriptionService from '../../services/subscriptionService';

const SubscriptionPlans = ({ onClose }) => {
  const { currentUser, subscriptionData, refreshSubscription } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const plans = paymentService.getSubscriptionPlans();
  const currentPlan = subscriptionData?.planType || 'free';

  const handleUpgrade = async (planType) => {
    if (!currentUser || planType === 'free') return;

    setLoading(true);
    setSelectedPlan(planType);

    try {
      await paymentService.processSubscriptionPayment(
        planType,
        currentUser.uid,
        currentUser.email,
        currentUser.displayName || currentUser.email
      );

      // Refresh subscription data after successful payment
      await refreshSubscription();
      
      if (onClose) onClose();
      
      // Show success message
      alert('Subscription upgraded successfully!');
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      alert('Failed to upgrade subscription. Please try again.');
    } finally {
      setLoading(false);
      setSelectedPlan(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!currentUser || currentPlan === 'free') return;

    const confirmCancel = window.confirm(
      'Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing cycle.'
    );

    if (!confirmCancel) return;

    setLoading(true);

    try {
      await subscriptionService.cancelSubscription(currentUser.uid);
      await refreshSubscription();
      alert('Subscription cancelled successfully.');
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      alert('Failed to cancel subscription. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp.seconds * 1000).toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900">Choose Your Plan</h2>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            )}
          </div>

          {/* Current Subscription Status */}
          {subscriptionData && (
            <div className="mb-8 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">Current Subscription</h3>
              <div className="text-sm text-gray-600">
                <p><strong>Plan:</strong> {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}</p>
                {subscriptionData.expiresAt && (
                  <p><strong>Expires:</strong> {formatDate(subscriptionData.expiresAt)}</p>
                )}
                <p><strong>Status:</strong> 
                  <span className={`ml-2 px-2 py-1 rounded text-xs ${
                    subscriptionData.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {subscriptionData.status}
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* Usage Statistics */}
          {subscriptionData && (
            <div className="mb-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">This Month's Usage</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Pathways Generated</p>
                  <p className="font-semibold">{subscriptionData.usage?.pathwaysGenerated || 0}</p>
                </div>
                <div>
                  <p className="text-gray-600">University Comparisons</p>
                  <p className="font-semibold">{subscriptionData.usage?.universityComparisons || 0}</p>
                </div>
                <div>
                  <p className="text-gray-600">PDF Exports</p>
                  <p className="font-semibold">{subscriptionData.usage?.pdfExports || 0}</p>
                </div>
              </div>
            </div>
          )}

          {/* Subscription Plans */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const isCurrentPlan = plan.type === currentPlan;
              const isUpgrade = plans.findIndex(p => p.type === currentPlan) < plans.findIndex(p => p.type === plan.type);

              return (
                <div
                  key={plan.type}
                  className={`relative border-2 rounded-lg p-6 ${
                    plan.recommended 
                      ? 'border-blue-500 shadow-lg' 
                      : isCurrentPlan 
                        ? 'border-green-500' 
                        : 'border-gray-200'
                  }`}
                >
                  {plan.recommended && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                        Recommended
                      </span>
                    </div>
                  )}

                  {isCurrentPlan && (
                    <div className="absolute -top-3 right-4">
                      <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                        Current Plan
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <div className="text-4xl font-bold text-blue-600 mb-2">
                      ₹{plan.price}
                      {plan.price > 0 && <span className="text-lg font-normal text-gray-600">/month</span>}
                    </div>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}

                    {plan.limitations && plan.limitations.map((limitation, index) => (
                      <li key={`limitation-${index}`} className="flex items-start">
                        <svg className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-500">{limitation}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto">
                    {isCurrentPlan ? (
                      <div className="text-center">
                        <button
                          disabled
                          className="w-full bg-gray-300 text-gray-500 py-2 px-4 rounded-lg font-medium mb-2"
                        >
                          Current Plan
                        </button>
                        {plan.type !== 'free' && (
                          <button
                            onClick={handleCancelSubscription}
                            disabled={loading}
                            className="w-full text-red-600 hover:text-red-800 text-sm underline"
                          >
                            Cancel Subscription
                          </button>
                        )}
                      </div>
                    ) : plan.type === 'free' ? (
                      <button
                        disabled
                        className="w-full bg-gray-200 text-gray-500 py-2 px-4 rounded-lg font-medium"
                      >
                        Free Forever
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpgrade(plan.type)}
                        disabled={loading || selectedPlan === plan.type}
                        className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                          plan.recommended
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-gray-900 hover:bg-gray-800 text-white'
                        } ${loading && selectedPlan === plan.type ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {loading && selectedPlan === plan.type 
                          ? 'Processing...' 
                          : isUpgrade 
                            ? `Upgrade to ${plan.name}` 
                            : `Switch to ${plan.name}`
                        }
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 text-center text-sm text-gray-600">
            <p>All payments are processed securely through Razorpay</p>
            <p>You can cancel or change your plan at any time</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlans;
