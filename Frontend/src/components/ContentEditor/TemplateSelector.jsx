// /frontend/src/components/ContentEditor/TemplateSelector.jsx
import React, { useState } from 'react';
import { FaTimes, FaSearch } from 'react-icons/fa';

const TemplateSelector = ({ templates, onSelect, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredTemplates = templates.filter(template =>
    template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">Select Template</h2>
          <button
            className="text-gray-500 hover:text-gray-700"
            onClick={onClose}
          >
            <FaTimes />
          </button>
        </div>
        
        <div className="p-4 border-b">
          <div className="relative">
            <input
              type="text"
              className="w-full p-2 pl-10 border rounded"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <FaSearch />
            </div>
          </div>
        </div>
        
        <div className="flex-grow overflow-auto p-4">
          {filteredTemplates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="border rounded p-4 hover:shadow-md cursor-pointer transition-shadow"
                  onClick={() => onSelect(template.id)}
                >
                  <h3 className="font-bold mb-2">{template.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                  <div className="flex items-center text-xs text-gray-500">
                    <span>{template.blocks?.length || 0} blocks</span>
                    <span className="mx-2">•</span>
                    <span>{template.category}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No templates found matching your search criteria.</p>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t flex justify-end">
          <button
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateSelector;
