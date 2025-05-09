import React from 'react';

const Loader = ({ size = 'md', color = 'blue', fullScreen = false, text = 'Loading...' }) => {
  // Size classes
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-4',
    xl: 'h-16 w-16 border-4'
  };
  
  // Color classes
  const colorClasses = {
    blue: 'border-blue-500',
    green: 'border-green-500',
    red: 'border-red-500',
    yellow: 'border-yellow-500',
    gray: 'border-gray-500'
  };
  
  const spinnerClasses = `
    animate-spin rounded-full 
    ${sizeClasses[size] || sizeClasses.md} 
    border-b-transparent ${colorClasses[color] || colorClasses.blue}
  `;
  
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/70 dark:bg-gray-900/70 z-50 flex flex-col items-center justify-center">
        <div className={spinnerClasses}></div>
        {text && (
          <p className="mt-4 text-gray-600 dark:text-gray-300 font-medium">{text}</p>
        )}
      </div>
    );
  }
  
  return (
    <div className="flex flex-col items-center justify-center">
      <div className={spinnerClasses}></div>
      {text && (
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{text}</p>
      )}
    </div>
  );
};

export default Loader;