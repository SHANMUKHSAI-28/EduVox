import AdBanner from './AdBanner';

const AdContainer = ({ 
  children, 
  adSlots = [], // Array of AdSense slot IDs
  adFrequency = 3, // Show ad every N items
  adSize = 'medium',
  adFormat = 'auto',
  className = '' 
}) => {
  // If no ad slots provided, just render children normally
  if (!adSlots || adSlots.length === 0) {
    return <div className={className}>{children}</div>;
  }

  const shouldShowAd = (index) => {
    return (index + 1) % adFrequency === 0;
  };

  const getAdSlot = (adIndex) => {
    // Cycle through available ad slots
    return adSlots[adIndex % adSlots.length];
  };

  if (!Array.isArray(children)) {
    return <div className={className}>{children}</div>;
  }

  const renderWithAds = () => {
    const result = [];
    let adCounter = 0;
    
    children.forEach((child, index) => {
      result.push(child);
      
      // Add ad after every adFrequency items (but not after the last item)
      if (shouldShowAd(index) && index < children.length - 1) {
        const adSlot = getAdSlot(adCounter);
        result.push(
          <div key={`adsense-${index}-${adCounter}`} className="my-6 flex justify-center">
            <AdBanner 
              slot={adSlot}
              size={adSize}
              format={adFormat}
              className="w-full max-w-4xl"
            />
          </div>
        );
        adCounter++;
      }
    });

    return result;
  };

  return (
    <div className={className}>
      {renderWithAds()}
    </div>
  );
};

export default AdContainer;
