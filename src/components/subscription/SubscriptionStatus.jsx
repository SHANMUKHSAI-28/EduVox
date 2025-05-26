import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import SubscriptionPlans from './SubscriptionPlans';

const SubscriptionStatus = () => {
  const { subscriptionData } = useAuth();
  const [showPlans, setShowPlans] = useState(false);

  if (!subscriptionData) return null;

  const planType = subscriptionData.planType || 'free';
  const isExpiringSoon = subscriptionData.expiresAt && 
    new Date(subscriptionData.expiresAt.seconds * 1000) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const getPlanColor = (plan) => {
    switch (plan) {
      case 'pro': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'premium': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPlanIcon = (plan) => {
    switch (plan) {
      case 'pro':
        return (
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9.664 1.319a.75.75 0 01.672 0 41.059 41.059 0 018.198 5.424.75.75 0 01-.254 1.285 31.372 31.372 0 00-7.86 3.83.75.75 0 01-.84 0 31.508 31.508 0 00-2.08-1.287V9.394c0-.244.116-.463.302-.592a35.504 35.504 0 013.305-2.033.75.75 0 00-.714-1.319 37 37 0 00-3.446 2.12A2.216 2.216 0 006 9.393v.38a31.293 31.293 0 00-4.28-1.746.75.75 0 01-.254-1.285A41.059 41.059 0 019.664 1.319zM6.75 15.75a.75.75 0 01.75-.75h5a.75.75 0 010 1.5h-5a.75.75 0 01-.75-.75z" clipRule="evenodd" />
          </svg>
        );
      case 'premium':
        return (
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setShowPlans(true)}
          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getPlanColor(planType)} hover:opacity-80 transition-opacity`}
        >
          {getPlanIcon(planType)}
          {planType.charAt(0).toUpperCase() + planType.slice(1)}
          {planType === 'free' && (
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          )}
        </button>

        {isExpiringSoon && planType !== 'free' && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" title="Subscription expiring soon" />
        )}
      </div>

      {showPlans && (
        <SubscriptionPlans onClose={() => setShowPlans(false)} />
      )}
    </>
  );
};

export default SubscriptionStatus;
