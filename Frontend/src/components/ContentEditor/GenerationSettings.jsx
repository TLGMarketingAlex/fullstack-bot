// /frontend/src/components/ContentEditor/GenerationSettings.jsx
import React from 'react';
import { FaTimes } from 'react-icons/fa';
import LoadingSpinner from '../common/LoadingSpinner';

const GenerationSettings = ({ settings, onChange, onGenerate, onClose, isGenerating }) => {
  const handleChange = (field, value) => {
    onChange({
      ...settings,
      [field]: value
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">Content Generation Settings</h2>
          <button
            className="text-gray-500 hover:text-gray-700"
            onClick={onClose}
            disabled={isGenerating}
          >
            <FaTimes />
          </button>
        </div>
        
        <div className="flex-grow overflow-auto p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tone
            </label>
            <select
              className="w-full p-2 border rounded"
              value={settings.tone}
              onChange={(e) => handleChange('tone', e.target.value)}
              disabled={isGenerating}
            >
              <option value="professional">Professional</option>
              <option value="casual">Casual</option>
              <option value="friendly">Friendly</option>
              <option value="authoritative">Authoritative</option>
              <option value="humorous">Humorous</option>
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Length
            </label>
            <select
              className="w-full p-2 border rounded"
              value={settings.length}
              onChange={(e) => handleChange('length', e.target.value)}
              disabled={isGenerating}
            >
              <option value="short">Short</option>
              <option value="medium">Medium</option>
              <option value="long">Long</option>
              <option value="comprehensive">Comprehensive</option>
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Audience
            </label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              placeholder="E.g., professionals, beginners, tech enthusiasts..."
              value={settings.targetAudience}
              onChange={(e) => handleChange('targetAudience', e.target.value)}
              disabled={isGenerating}
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Keywords (comma separated)
            </label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              placeholder="E.g., AI, content generation, automation..."
              value={settings.keywords}
              onChange={(e) => handleChange('keywords', e.target.value)}
              disabled={isGenerating}
            />
          </div>
        </div>
        
        <div className="p-4 border-t flex justify-end">
          <button
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded mr-2"
            onClick={onClose}
            disabled={isGenerating}
          >
            Cancel
          </button>
          
          <button
            className="px-4 py-2 bg-green-500 text-white rounded flex items-center"
            onClick={onGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Generating...
              </>
            ) : (
              'Generate Content'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GenerationSettings;
