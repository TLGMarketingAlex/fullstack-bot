// /frontend/src/components/common/Pagination.jsx
import React from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange,
  siblingCount = 1,
  boundaryCount = 1
}) => {
  if (totalPages <= 1) return null;
  
  const range = (start, end) => {
    const length = end - start + 1;
    return Array.from({ length }, (_, i) => start + i);
  };
  
  const startPages = range(1, Math.min(boundaryCount, totalPages));
  const endPages = range(
    Math.max(totalPages - boundaryCount + 1, boundaryCount + 1),
    totalPages
  );
  
  const siblingsStart = Math.max(
    Math.min(
      currentPage - siblingCount,
      totalPages - boundaryCount - siblingCount * 2 - 1
    ),
    boundaryCount + 2
  );
  
  const siblingsEnd = Math.min(
    Math.max(
      currentPage + siblingCount,
      boundaryCount + siblingCount * 2 + 2
    ),
    endPages.length > 0 ? endPages[0] - 1 : totalPages - 1
  );
  
  const itemList = [
    ...startPages,
    ...(siblingsStart > boundaryCount + 2
      ? ['ellipsis']
      : boundaryCount + 1 < totalPages - boundaryCount
      ? [boundaryCount + 1]
      : []),
    ...range(siblingsStart, siblingsEnd),
    ...(siblingsEnd < totalPages - boundaryCount - 1
      ? ['ellipsis']
      : totalPages - boundaryCount > boundaryCount
      ? [totalPages - boundaryCount]
      : []),
    ...endPages
  ];
  
  const buttonClasses = "px-3 py-1 border rounded";
  
  return (
    <div className="flex items-center justify-center space-x-1 mt-4">
      <button
        className={`${buttonClasses} ${
          currentPage === 1
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
        onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <FaChevronLeft className="h-4 w-4" />
      </button>
      
      {itemList.map((item, index) => 
        item === 'ellipsis' ? (
          <span key={`ellipsis-${index}`} className="px-3 py-1">
            &hellip;
          </span>
        ) : (
          <button
            key={item}
            className={`${buttonClasses} ${
              currentPage === item
                ? 'bg-blue-500 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => onPageChange(item)}
          >
            {item}
          </button>
        )
      )}
      
      <button
        className={`${buttonClasses} ${
          currentPage === totalPages
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
        onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <FaChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
};

export default Pagination;
