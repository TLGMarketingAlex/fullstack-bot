// src/components/ContentEditor/TemplateSelector.jsx
import React, { useState } from 'react';
import { FiSearch, FiInfo } from 'react-icons/fi';

export const TemplateSelector = ({ 
  templates = [], 
  selectedTemplateId, 
  onSelect,
  isLoading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  
  // Filter templates based on search term and filter
  const filteredTemplates = templates
    .filter(template => {
      // Filter by content type
      if (filter !== 'all' && template.contentType !== filter) {
        return false;
      }
      
      // Filter by search term
      if (searchTerm.trim() !== '') {
        return (
          template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          template.description?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      return true;
    })
    .sort((a, b) => {
      // Show system templates at the top
      if (a.isSystem && !b.isSystem) return -1;
      if (!a.isSystem && b.isSystem) return 1;
      
      // Sort by name
      return a.name.localeCompare(b.name);
    });

  // Group templates by type for display
  const groupedTemplates = filteredTemplates.reduce((groups, template) => {
    const { contentType } = template;
    if (!groups[contentType]) {
      groups[contentType] = [];
    }
    groups[contentType].push(template);
    return groups;
  }, {});

  // Get type name for display
  const getContentTypeName = (type) => {
    const typeNames = {
      blog: 'Blog Post',
      product: 'Product',
      social: 'Social Media',
      email: 'Email',
      custom: 'Custom'
    };
    
    return typeNames[type] || type;
  };

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <FiSearch className="w-4 h-4 text-gray-500" />
        </div>
        <input
          type="text"
          className="w-full py-2 pl-10 pr-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Search templates..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      {/* Filter tabs */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        <button
          className={`px-3 py-1 text-sm rounded-md ${
            filter === 'all'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          className={`px-3 py-1 text-sm rounded-md ${
            filter === 'blog'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => setFilter('blog')}
        >
          Blog Posts
        </button>
        <button
          className={`px-3 py-1 text-sm rounded-md ${
            filter === 'product'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => setFilter('product')}
        >
          Products
        </button>
        <button
          className={`px-3 py-1 text-sm rounded-md ${
            filter === 'social'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => setFilter('social')}
        >
          Social
        </button>
        <button
          className={`px-3 py-1 text-sm rounded-md ${
            filter === 'email'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => setFilter('email')}
        >
          Emails
        </button>
      </div>
      
      {/* Loading state */}
      {isLoading ? (
        <div className="py-4 text-center text-gray-500">
          <div className="inline-block animate-spin w-5 h-5 mr-2 border-2 border-gray-300 border-t-blue-500 rounded-full"></div>
          Loading templates...
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="py-4 text-center text-gray-500">
          No templates found. Try adjusting your search.
        </div>
      ) : (
        /* Template list by groups */
        <div className="space-y-4">
          {Object.entries(groupedTemplates).map(([type, templates]) => (
            <div key={type} className="space-y-2">
              <h3 className="text-sm font-medium text-gray-600 uppercase">
                {getContentTypeName(type)}
              </h3>
              <div className="space-y-2">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className={`p-3 rounded-md cursor-pointer transition-colors ${
                      selectedTemplateId === template.id
                        ? 'bg-blue-50 border border-blue-200'
                        : 'bg-white border border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => onSelect(template.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="font-medium text-gray-900">
                        {template.name}
                      </div>
                      {template.isSystem && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          System
                        </span>
                      )}
                    </div>
                    {template.description && (
                      <div className="mt-1 text-sm text-gray-500 line-clamp-2">
                        {template.description}
                      </div>
                    )}
                    {selectedTemplateId === template.id && (
                      <div className="mt-2 text-sm text-blue-700">
                        Selected
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Info */}
      <div className="text-sm text-gray-500 flex items-start p-3 bg-gray-50 rounded-md">
        <FiInfo className="h-5 w-5 mr-2 text-gray-400 flex-shrink-0 mt-0.5" />
        <div>
          Templates help you generate structured content more efficiently. 
          Select a template to apply its structure and generation settings to your content.
        </div>
      </div>
    </div>
  );
};

export default TemplateSelector;
