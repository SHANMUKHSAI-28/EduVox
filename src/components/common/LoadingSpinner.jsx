const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  return (
    <div className={`animate-spin rounded-full border-2 border-primary-200 border-t-primary-600 ${sizes[size]} ${className}`}>
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default LoadingSpinner;
