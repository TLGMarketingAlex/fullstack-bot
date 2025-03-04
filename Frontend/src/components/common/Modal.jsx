// /frontend/src/components/common/Modal.jsx
import React, { useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer,
  size = 'md',
  closeOnOverlayClick = true 
}) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4'
  };
  
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };
  
  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 p-4"
      onClick={handleOverlayClick}
    >
      <div className={`bg-white rounded-lg shadow-xl overflow-hidden w-full ${sizeClasses[size]}`}>
        {title && (
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="text-lg font-medium">{title}</h3>
            <button
              className="text-gray-500 hover:text-gray-700"
              onClick={onClose}
            >
              <FaTimes />
            </button>
          </div>
        )}
        
        <div className="p-4 overflow-auto max-h-[calc(80vh-130px)]">
          {children}
        </div>
        
        {footer && (
          <div className="p-4 border-t bg-gray-50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
