// /frontend/src/components/ContentEditor/EditorToolbar.jsx
import React, { useState } from 'react';
import { FaSave, FaPlus, FaFileAlt, FaMagic } from 'react-icons/fa';

const EditorToolbar = ({ onSave, onAddBlock, onShowTemplates, onShowGenerationSettings }) => {
  const [blockDropdownOpen, setBlockDropdownOpen] = useState(false);
  
  const toggleBlockDropdown = () => {
    setBlockDropdownOpen(!blockDropdownOpen);
  };
  
  const handleAddBlock = (blockType) => {
    onAddBlock(blockType);
    setBlockDropdownOpen(false);
  };
  
  return (
    <div className="bg-white border-b border-gray-200 p-2 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded flex items-center"
          onClick={onSave}
        >
          <FaSave className="mr-2" />
          Save
        </button>
        
        <div className="relative inline-block">
          <button
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded flex items-center"
            onClick={toggleBlockDropdown}
          >
            <FaPlus className="mr-2" />
            Add Block
          </button>
          
          {blockDropdownOpen && (
            <div className="absolute left-0 mt-2 w-48 bg-white rounded shadow-lg z-10">
              <div className="py-1">
                <button 
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100" 
                  onClick={() => handleAddBlock('heading')}
                >
                  Heading
                </button>
                <button 
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100" 
                  onClick={() => handleAddBlock('paragraph')}
                >
                  Paragraph
                </button>
                <button 
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100" 
                  onClick={() => handleAddBlock('list')}
                >
                  List
                </button>
                <button 
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100" 
                  onClick={() => handleAddBlock('image')}
                >
                  Image
                </button>
                <button 
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100" 
                  onClick={() => handleAddBlock('quote')}
                >
                  Quote
                </button>
                <button 
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100" 
                  onClick={() => handleAddBlock('code')}
                >
                  Code
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <button
          className="px-4 py-2 bg-purple-500 text-white rounded flex items-center"
          onClick={onShowTemplates}
        >
          <FaFileAlt className="mr-2" />
          Templates
        </button>
        
        <button
          className="px-4 py-2 bg-green-500 text-white rounded flex items-center"
          onClick={onShowGenerationSettings}
        >
          <FaMagic className="mr-2" />
          Generate
        </button>
      </div>
    </div>
  );
};

export default EditorToolbar;
