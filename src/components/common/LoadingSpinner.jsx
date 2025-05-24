const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
    xl: 'h-16 w-16 border-4'
  };

  return (
    <div className={`animate-spin rounded-full border-secondary-200 border-t-primary-500 border-r-accent-500 ${sizes[size]} ${className} filter drop-shadow-lg`}>
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default LoadingSpinner;
