// /frontend/src/components/ContentEditor/ContentBlocks.jsx
import React from 'react';
import { FaArrowUp, FaArrowDown, FaTrash } from 'react-icons/fa';

const ContentBlocks = ({ blocks, activeBlock, onSelectBlock, onUpdateBlock, onDeleteBlock, onMoveBlock }) => {
  const renderBlockContent = (block) => {
    const isActive = activeBlock === block.id;
    const baseClasses = "w-full p-4 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500";
    
    switch (block.type) {
      case 'heading':
        return (
          <input
            type="text"
            className={`${baseClasses} text-xl font-bold`}
            value={block.content}
            onChange={(e) => onUpdateBlock(block.id, { content: e.target.value })}
            placeholder="Heading..."
          />
        );
        
      case 'paragraph':
        return (
          <textarea
            className={`${baseClasses} min-h-[100px]`}
            value={block.content}
            onChange={(e) => onUpdateBlock(block.id, { content: e.target.value })}
            placeholder="Write paragraph content..."
          />
        );
        
      case 'list':
        return (
          <div className={baseClasses}>
            <select
              className="mb-2 p-2 border rounded"
              value={block.metadata.listType || 'bullet'}
              onChange={(e) => onUpdateBlock(block.id, { 
                metadata: { ...block.metadata, listType: e.target.value } 
              })}
            >
              <option value="bullet">Bullet List</option>
              <option value="numbered">Numbered List</option>
            </select>
            
            <textarea
              className="w-full p-2 border rounded"
              value={block.content}
              onChange={(e) => onUpdateBlock(block.id, { content: e.target.value })}
              placeholder="Enter list items, one per line..."
            />
          </div>
        );
        
      case 'image':
        return (
          <div className={baseClasses}>
            <input
              type="text"
              className="w-full p-2 border rounded mb-2"
              value={block.metadata.imageUrl || ''}
              onChange={(e) => onUpdateBlock(block.id, { 
                metadata: { ...block.metadata, imageUrl: e.target.value } 
              })}
              placeholder="Image URL..."
            />
            
            <input
              type="text"
              className="w-full p-2 border rounded"
              value={block.content}
              onChange={(e) => onUpdateBlock(block.id, { content: e.target.value })}
              placeholder="Image caption..."
            />
            
            {block.metadata.imageUrl && (
              <div className="mt-2">
                <img 
                  src={block.metadata.imageUrl} 
                  alt={block.content} 
                  className="max-w-full h-auto"
                />
              </div>
            )}
          </div>
        );
        
      case 'quote':
        return (
          <div className={baseClasses}>
            <textarea
              className="w-full p-2 border rounded mb-2"
              value={block.content}
              onChange={(e) => onUpdateBlock(block.id, { content: e.target.value })}
              placeholder="Quote text..."
            />
            
            <input
              type="text"
              className="w-full p-2 border rounded"
              value={block.metadata.source || ''}
              onChange={(e) => onUpdateBlock(block.id, { 
                metadata: { ...block.metadata, source: e.target.value } 
              })}
              placeholder="Quote source..."
            />
          </div>
        );
        
      case 'code':
        return (
          <div className={baseClasses}>
            <select
              className="mb-2 p-2 border rounded"
              value={block.metadata.language || 'javascript'}
              onChange={(e) => onUpdateBlock(block.id, { 
                metadata: { ...block.metadata, language: e.target.value } 
              })}
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="html">HTML</option>
              <option value="css">CSS</option>
            </select>
            
            <textarea
              className="w-full p-2 border rounded font-mono"
              value={block.content}
              onChange={(e) => onUpdateBlock(block.id, { content: e.target.value })}
              placeholder="// Enter code here..."
            />
          </div>
        );
        
      default:
        return (
          <div>Unsupported block type: {block.type}</div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {blocks.map((block) => (
        <div 
          key={block.id}
          className={`border rounded p-4 hover:shadow-md transition-shadow ${
            activeBlock === block.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
          }`}
          onClick={() => onSelectBlock(block.id)}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-gray-500 capitalize">
              {block.type}
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                className="p-1 text-gray-500 hover:text-blue-500"
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveBlock(block.id, 'up');
                }}
              >
                <FaArrowUp />
              </button>
              
              <button
                className="p-1 text-gray-500 hover:text-blue-500"
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveBlock(block.id, 'down');
                }}
              >
                <FaArrowDown />
              </button>
              
              <button
                className="p-1 text-gray-500 hover:text-red-500"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteBlock(block.id);
                }}
              >
                <FaTrash />
              </button>
            </div>
          </div>
          
          {renderBlockContent(block)}
        </div>
      ))}
      
      {blocks.length === 0 && (
        <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded">
          <p className="text-gray-500">
            No content blocks yet. Click the "Add Block" button to start creating content.
          </p>
        </div>
      )}
    </div>
  );
};

export default ContentBlocks;
