// /frontend/src/components/common/Button.jsx
import React from 'react';

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md', 
  type = 'button', 
  disabled = false, 
  fullWidth = false, 
  className = ''
}) => {
  const baseClasses = 'rounded font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-opacity-50';
  
  const variantClasses = {
    primary: 'bg-blue-500 hover:bg-blue-600 text-white focus:ring-blue-500',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800 focus:ring-gray-500',
    success: 'bg-green-500 hover:bg-green-600 text-white focus:ring-green-500',
    danger: 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-500',
    outline: 'bg-transparent border border-gray-300 hover:bg-gray-100 text-gray-800 focus:ring-gray-500'
  };
  
  const sizeClasses = {
    sm: 'text-sm px-3 py-1',
    md: 'px-4 py-2',
    lg: 'text-lg px-6 py-3'
  };
  
  const widthClass = fullWidth ? 'w-full' : '';
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';
  
  return (
    <button
      type={type}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${disabledClasses} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;
