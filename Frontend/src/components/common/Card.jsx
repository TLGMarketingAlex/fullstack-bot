// /frontend/src/components/common/Card.jsx
import React from 'react';

const Card = ({ 
  children, 
  title, 
  subtitle, 
  footer, 
  className = '',
  padding = true,
  shadow = true,
  border = true
}) => {
  const baseClasses = 'bg-white rounded-lg';
  const shadowClass = shadow ? 'shadow-md' : '';
  const borderClass = border ? 'border border-gray-200' : '';
  const paddingClass = padding ? 'p-4' : '';
  
  return (
    <div className={`${baseClasses} ${shadowClass} ${borderClass} ${className}`}>
      {title && (
        <div className="border-b border-gray-200 p-4">
          <h3 className="text-lg font-medium">{title}</h3>
          {subtitle && <p className="text-gray-500 text-sm mt-1">{subtitle}</p>}
        </div>
      )}
      
      <div className={paddingClass}>{children}</div>
      
      {footer && (
        <div className="border-t border-gray-200 p-4">{footer}</div>
      )}
    </div>
  );
};

export default Card;
