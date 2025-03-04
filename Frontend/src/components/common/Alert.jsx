// /frontend/src/components/common/Alert.jsx
import React from 'react';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaExclamationTriangle } from 'react-icons/fa';

const Alert = ({ 
  type = 'info', 
  title, 
  message, 
  children, 
  onClose, 
  className = '' 
}) => {
  const types = {
    success: {
      icon: <FaCheckCircle className="text-green-500" />,
      classes: 'bg-green-50 border-green-200 text-green-800'
    },
    error: {
      icon: <FaExclamationCircle className="text-red-500" />,
      classes: 'bg-red-50 border-red-200 text-red-800'
    },
    warning: {
      icon: <FaExclamationTriangle className="text-yellow-500" />,
      classes: 'bg-yellow-50 border-yellow-200 text-yellow-800'
    },
    info: {
      icon: <FaInfoCircle className="text-blue-500" />,
      classes: 'bg-blue-50 border-blue-200 text-blue-800'
    }
  };
  
  const { icon, classes } = types[type] || types.info;
  
  return (
    <div className={`border rounded-md p-4 ${classes} ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0 mr-3">
          {icon}
        </div>
        <div className="flex-1">
          {title && <h3 className="text-sm font-medium mb-1">{title}</h3>}
          <div className="text-sm">
            {message || children}
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            className="ml-auto -mx-1.5 -my-1.5 bg-transparent text-gray-400 hover:text-gray-700 rounded-lg p-1.5"
            onClick={onClose}
          >
            <span className="sr-only">Dismiss</span>
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default Alert;
