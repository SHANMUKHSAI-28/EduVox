const FormTextarea = ({ 
  label, 
  error, 
  rows = 4,
  className = '',
  icon,
  ...props 
}) => {
  const textareaClasses = `
    w-full px-4 py-3 ${icon ? 'pl-12' : ''} rounded-xl border-2 
    bg-white/50 backdrop-blur-sm transition-all duration-300
    text-secondary-900 placeholder-secondary-400 resize-none
    focus:outline-none focus:ring-0 focus:scale-[1.02]
    ${error 
      ? 'border-danger-300 focus:border-danger-500 focus:shadow-danger-glow' 
      : 'border-secondary-200 focus:border-primary-400 focus:shadow-primary-glow hover:border-secondary-300'
    }
    ${className}
  `;

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-semibold text-secondary-700 ml-1">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-4 text-secondary-400">
            {icon}
          </div>
        )}
        <textarea
          rows={rows}
          className={textareaClasses}
          {...props}
        />
      </div>
      {error && (
        <p className="text-sm text-danger-600 ml-1 flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
};

export default FormTextarea;
