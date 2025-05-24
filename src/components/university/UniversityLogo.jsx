import { useState } from 'react';

const UniversityLogo = ({ 
  university, 
  size = 'md', 
  className = '',
  showFallback = true 
}) => {
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(true);

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-8 h-8';
      case 'lg':
        return 'w-16 h-16';
      case 'xl':
        return 'w-24 h-24';
      default:
        return 'w-12 h-12';
    }
  };

  const getFallbackInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .slice(0, 2)
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase();
  };

  const getFallbackColors = (name) => {
    if (!name) return 'from-gray-400 to-gray-600';
    
    const colors = [
      'from-blue-400 to-blue-600',
      'from-green-400 to-green-600',
      'from-purple-400 to-purple-600',
      'from-red-400 to-red-600',
      'from-yellow-400 to-yellow-600',
      'from-indigo-400 to-indigo-600',
      'from-pink-400 to-pink-600',
      'from-teal-400 to-teal-600'
    ];
    
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Try to get logo URL from multiple sources
  const getLogoUrl = () => {
    if (university.logo_url) return university.logo_url;
    if (university.logoUrl) return university.logoUrl;
    if (university.image_url) return university.image_url;
    if (university.imageUrl) return university.imageUrl;
    
    // Generate logo URL based on university website
    if (university.website) {
      try {
        const domain = new URL(university.website).hostname;
        return `https://logo.clearbit.com/${domain}`;
      } catch (e) {
        console.warn('Invalid website URL for logo generation:', university.website);
      }
    }
    
    return null;
  };

  const logoUrl = getLogoUrl();
  const initials = getFallbackInitials(university.name);
  const fallbackColors = getFallbackColors(university.name);

  const handleImageLoad = () => {
    setLoading(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setLoading(false);
  };

  return (
    <div className={`${getSizeClasses()} ${className} relative`}>
      {logoUrl && !imageError ? (
        <>
          {loading && showFallback && (
            <div className={`absolute inset-0 bg-gradient-to-br ${fallbackColors} rounded-full flex items-center justify-center animate-pulse`}>
              <span className="text-white font-bold text-xs">
                {initials}
              </span>
            </div>
          )}
          <img
            src={logoUrl}
            alt={`${university.name} logo`}
            className={`w-full h-full object-contain rounded-full border-2 border-white shadow-md ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        </>
      ) : showFallback ? (
        <div className={`w-full h-full bg-gradient-to-br ${fallbackColors} rounded-full flex items-center justify-center shadow-md border-2 border-white`}>
          <span className="text-white font-bold text-xs">
            {initials}
          </span>
        </div>
      ) : null}
    </div>
  );
};

export default UniversityLogo;
