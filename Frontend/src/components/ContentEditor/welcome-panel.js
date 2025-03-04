// src/components/dashboard/WelcomePanel.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiExternalLink } from 'react-icons/fi';
import { Button } from '../common/Button';

export const WelcomePanel = ({ user }) => {
  // Get time of day for greeting
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {getTimeBasedGreeting()}, {user?.firstName || 'there'}!
          </h1>
          <p className="text-gray-600 mt-1">
            Welcome to your AI Content Platform dashboard
          </p>
        </div>
        <Link to="/content/new">
          <Button variant="primary" icon={<FiPlus />}>
            Create New Content
          </Button>
        </Link>
      </div>

      {/* Quick tips section */}
      <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
        <h3 className="font-semibold text-blue-700 mb-2">Quick Tips</h3>
        <ul className="text-sm text-blue-600 space-y-1">
          <li className="flex items-center">
            <span className="mr-2">•</span> 
            Use templates to quickly generate content for specific purposes
          </li>
          <li className="flex items-center">
            <span className="mr-2">•</span> 
            Customize AI settings to match your brand voice and style
          </li>
          <li className="flex items-center">
            <span className="mr-2">•</span> 
            Connect integrations to publish content directly to your platforms
          </li>
        </ul>
        <div className="mt-3">
          <a 
            href="https://docs.example.com/getting-started" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center"
          >
            View documentation <FiExternalLink className="ml-1" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default WelcomePanel;
