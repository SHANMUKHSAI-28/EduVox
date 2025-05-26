import { useEffect, useRef } from 'react';
import { useSubscriptionLimits } from '../../hooks/useSubscriptionLimits';

const AdBanner = ({ 
  slot = '', // AdSense ad unit slot ID
  size = 'medium', // 'small', 'medium', 'large', 'responsive'
  format = 'auto', // 'auto', 'rectangle', 'vertical', 'horizontal'
  className = '',
  style = {}
}) => {
  const { planType } = useSubscriptionLimits();
  const adRef = useRef(null);

  // Don't render ads for premium/pro users
  if (planType !== 'free') {
    return null;
  }

  // AdSense size configurations
  const getAdSenseConfig = () => {
    switch (size) {
      case 'small':
        return {
          width: 320,
          height: 100,
          'data-ad-format': format === 'auto' ? 'auto' : format
        };
      case 'medium':
        return {
          width: 728,
          height: 90,
          'data-ad-format': format === 'auto' ? 'auto' : format
        };
      case 'large':
        return {
          width: 970,
          height: 250,
          'data-ad-format': format === 'auto' ? 'auto' : format
        };
      case 'responsive':
        return {
          'data-ad-format': 'auto',
          'data-full-width-responsive': 'true'
        };
      default:
        return {
          'data-ad-format': 'auto',
          'data-full-width-responsive': 'true'
        };
    }
  };

  useEffect(() => {
    // Load AdSense script if not already loaded
    if (!window.adsbygoogle) {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${import.meta.env.VITE_ADSENSE_CLIENT_ID}`;
                   import.meta.env.VITE_ADSENSE_CLIENT_ID;
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);
    }

    // Initialize ad after component mounts
    const timer = setTimeout(() => {
      try {
        if (window.adsbygoogle && adRef.current) {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        }
      } catch (error) {
        console.error('AdSense error:', error);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Don't render if no slot ID provided or in development
  if (!slot || !import.meta.env.VITE_ADSENSE_CLIENT_ID) {
    // Show placeholder in development
    if (import.meta.env.DEV) {
      return (
        <div 
          className={`bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-500 text-sm font-medium ${className}`}
          style={{ minHeight: '90px', ...style }}
        >
          AdSense Placeholder
          <br />
          <span className="text-xs">Slot: {slot || 'Not configured'}</span>
        </div>
      );
    }
    return null;
  }

  const adConfig = getAdSenseConfig();

  return (
    <div className={`adsense-container ${className}`} style={style}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ 
          display: 'block',
          width: adConfig.width ? `${adConfig.width}px` : 'auto',
          height: adConfig.height ? `${adConfig.height}px` : 'auto',
          ...style
        }}
        data-ad-client={import.meta.env.VITE_ADSENSE_CLIENT_ID}
        data-ad-slot={slot}
        data-ad-format={adConfig['data-ad-format']}
        data-full-width-responsive={adConfig['data-full-width-responsive']}
      />
    </div>
  );
};

export default AdBanner;
