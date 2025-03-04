// src/pages/ContentList.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { 
  FiPlus, 
  FiFileText, 
  FiEdit2, 
  FiTrash2, 
  FiSearch,
  FiFilter,
  FiChevronLeft,
  FiChevronRight,
  FiSlash
} from 'react-icons/fi';
import api from '../services/api';
import  Button from '../components/common/Button';
import { Card, CardContent } from '../components/common/Card';
import  LoadingSpinner  from '../components/common/LoadingSpinner';

const ContentList = () => {
  // Pagination and filter state
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState({
    status: '',
    contentType: '',
    search: ''
  });

  // Fetch content items
  const {
    data,
    isLoading,
    isError,
    refetch
  } = useQuery(
    ['contentItems', page, filter],
    async () => {
      const params = {
        page,
        limit: 10,
        ...filter
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '') {
          delete params[key];
        }
      });

      const response = await api.get('/content', { params });
      return response.data;
    },
    {
      keepPreviousData: true
    }
  );

  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter(prev => ({ ...prev, [name]: value }));
    setPage(1); // Reset to first page when filter changes
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    refetch();
  };

  // Reset filters
  const resetFilters = () => {
    setFilter({
      status: '',
      contentType: '',
      search: ''
    });
    setPage(1);
  };

  // Handle delete content
  const handleDeleteContent = async (id) => {
    if (!window.confirm('Are you sure you want to delete this content?')) {
      return;
    }

    try {
      await api.delete(`/content/${id}`);
      toast.success('Content deleted successfully');
      refetch();
    } catch (error) {
      console.error('Delete content error:', error);
      toast.error('Failed to delete content');
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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
    <div className="container mx-auto">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Content Library</h1>
        <Link to="/content/new">
          <Button icon={<FiPlus />}>
            Create New Content
          </Button>
        </Link>
      </div>

      <Card className="mb-8">
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="search" className="sr-only">Search</label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiSearch className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="search"
                    id="search"
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                    placeholder="Search content..."
                    value={filter.search}
                    onChange={handleFilterChange}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="status" className="sr-only">Status</label>
                <select
                  id="status"
                  name="status"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  value={filter.status}
                  onChange={handleFilterChange}
                >
                  <option value="">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="generated">Generated</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div>
                <label htmlFor="contentType" className="sr-only">Content Type</label>
                <select
                  id="contentType"
                  name="contentType"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  value={filter.contentType}
                  onChange={handleFilterChange}
                >
                  <option value="">All Types</option>
                  <option value="blog">Blog Post</option>
                  <option value="product">Product</option>
                  <option value="social">Social Media</option>
                  <option value="email">Email</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={resetFilters}>
                Clear Filters
              </Button>
              <Button type="submit" icon={<FiFilter />}>
                Apply Filters
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Content list */}
      {isLoading ? (
        <div className="py-12 flex justify-center">
          <LoadingSpinner size="lg" message="Loading content..." />
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="text-center py-12">
            <FiSlash className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">Error loading content</h3>
            <p className="mt-1 text-sm text-gray-500">An error occurred while loading your content.</p>
            <div className="mt-6">
              <Button onClick={() => refetch()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : data?.contentItems?.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FiFileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">No content found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter.search || filter.status || filter.contentType
                ? "No content matches your filters. Try adjusting your search criteria."
                : "You haven't created any content yet. Get started by creating your first content item."}
            </p>
            <div className="mt-6">
              <Link to="/content/new">
                <Button icon={<FiPlus />}>
                  Create New Content
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {data.contentItems.map((item) => (
                <li key={item.id}>
                  <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <FiFileText className="h-6 w-6 text-gray-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-blue-600 hover:text-blue-800">
                            <Link to={`/content/${item.id}`}>{item.title}</Link>
                          </div>
                          <div className="text-sm text-gray-500">
                            Created: {formatDate(item.createdAt)} • 
                            {item.wordCount > 0 ? ` ${item.wordCount} words` : ' No content yet'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(item.status)}`}>
                          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getContentTypeBadge(item.contentType)}`}>
                          {item.contentType.charAt(0).toUpperCase() + item.contentType.slice(1)}
                        </span>
                        <div className="ml-4 flex items-center space-x-2">
                          <Link to={`/content/${item.id}`}>
                            <Button variant="outline" size="sm" icon={<FiEdit2 />}>
                              Edit
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            icon={<FiTrash2 />}
                            onClick={() => handleDeleteContent(item.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Pagination */}
          {data.pagination && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{(page - 1) * 10 + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(page * 10, data.pagination.totalItems)}
                </span>{' '}
                of <span className="font-medium">{data.pagination.totalItems}</span> results
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  icon={<FiChevronLeft />}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= data.pagination.totalPages}
                  onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))}
                  icon={<FiChevronRight className="ml-1" />}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ContentList;
