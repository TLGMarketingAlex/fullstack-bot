// src/components/dashboard/RecentContentItem.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { FiFileText, FiEdit2, FiEye } from 'react-icons/fi';

export const RecentContentItem = ({ item }) => {
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get status badge color
  const getStatusBadge = (status) => {
    const statusClasses = {
      draft: 'bg-gray-100 text-gray-800',
      generated: 'bg-blue-100 text-blue-800',
      published: 'bg-green-100 text-green-800',
      archived: 'bg-yellow-100 text-yellow-800'
    };
    
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
  };

  // Get content type badge color
  const getContentTypeBadge = (type) => {
    const typeClasses = {
      blog: 'bg-purple-100 text-purple-800',
      product: 'bg-indigo-100 text-indigo-800',
      social: 'bg-pink-100 text-pink-800',
      email: 'bg-orange-100 text-orange-800',
      custom: 'bg-teal-100 text-teal-800'
    };
    
    return typeClasses[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="px-4 py-3 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <FiFileText className="h-5 w-5 text-gray-500" />
          </div>
          <div className="ml-3">
            <Link
              to={`/content/${item.id}`}
              className="text-sm font-medium text-gray-900 hover:text-blue-600"
            >
              {item.title}
            </Link>
            <div className="text-xs text-gray-500 mt-1">
              Created: {formatDate(item.createdAt)} • 
              {item.wordCount > 0 ? ` ${item.wordCount} words` : ' No content yet'}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(item.status)}`}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </span>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getContentTypeBadge(item.contentType)}`}>
            {item.contentType.charAt(0).toUpperCase() + item.contentType.slice(1)}
          </span>
          <div className="ml-2 flex items-center space-x-1">
            <Link to={`/content/${item.id}`} className="text-gray-500 hover:text-blue-600">
              <FiEdit2 className="h-4 w-4" />
            </Link>
            {item.publishedUrl && (
              <a 
                href={item.publishedUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-gray-500 hover:text-blue-600"
              >
                <FiEye className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecentContentItem;
