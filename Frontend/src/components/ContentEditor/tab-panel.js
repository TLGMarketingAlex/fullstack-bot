// src/components/common/TabPanel.jsx
import React from 'react';

/**
 * TabPanel component for showing/hiding content based on active state
 * 
 * @param {boolean} active - Whether this panel is active
 * @param {ReactNode} children - Content to display when panel is active
 * @param {string} className - Additional CSS classes
 */
export const TabPanel = ({ active, children, className = '' }) => {
  if (!active) {
    return null;
  }

  return (
    <div className={className}>
      {children}
    </div>
  );
};

export default TabPanel;
