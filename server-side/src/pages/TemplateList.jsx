// src/pages/TemplateList.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { 
  FiPlus, 
  FiCopy, 
  FiEdit2, 
  FiTrash2, 
  FiSearch,
  FiArchive,
  FiStar,
  FiSlash,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';
import api from '../services/api';
import  Button  from '../components/common/Button';
import CardHeader from '../components/common/Card';
import  LoadingSpinner  from '../components/common/LoadingSpinner';
import CardContent  from '../components/common/Card';
import  Card   from '../components/common/Card';
const TemplateList = () => {
  // Pagination and filter state
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState({
    contentType: '',
    search: '',
    showArchived: false
  });

  // Fetch templates
  const {
    data,
    isLoading,
    isError,
    refetch
  } = useQuery(
    ['templates', page, filter],
    async () => {
      const params = {
        page,
        limit: 10,
        contentType: filter.contentType,
        search: filter.search,
        includeArchived: filter.showArchived
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === false) {
          delete params[key];
        }
      });

      const response = await api.get('/templates', { params });
      return response.data;
    },
    {
      keepPreviousData: true
    }
  );

  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilter(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
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
      contentType: '',
      search: '',
      showArchived: false
    });
    setPage(1);
  };

  // Handle delete template
  const handleDeleteTemplate = async (id) => {
    if (!window.confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      await api.delete(`/templates/${id}`);
      toast.success('Template deleted successfully');
      refetch();
    } catch (error) {
      console.error('Delete template error:', error);
      toast.error('Failed to delete template');
    }
  };

  // Handle archive/unarchive template
  const handleArchiveTemplate = async (id, isArchived) => {
    try {
      await api.patch(`/templates/${id}`, { isArchived: !isArchived });
      toast.success(isArchived ? 'Template unarchived successfully' : 'Template archived successfully');
      refetch();
    } catch (error) {
      console.error('Archive template error:', error);
      toast.error(isArchived ? 'Failed to unarchive template' : 'Failed to archive template');
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
        <h1 className="text-2xl font-semibold text-gray-900">Templates</h1>
        <Link to="/templates/new">
          <Button icon={<FiPlus />}>
            Create New Template
          </Button>
        </Link>
      </div>

      <Card className="mb-8">
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    placeholder="Search templates..."
                    value={filter.search}
                    onChange={handleFilterChange}
                  />
                </div>
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
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="showArchived"
                  name="showArchived"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={filter.showArchived}
                  onChange={handleFilterChange}
                />
                <label htmlFor="showArchived" className="ml-2 block text-sm text-gray-900">
                  Show archived templates
                </label>
              </div>

              <div className="flex space-x-3">
                <Button type="button" variant="outline" onClick={resetFilters}>
                  Clear Filters
                </Button>
                <Button type="submit">
                  Apply Filters
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Template list */}
      {isLoading ? (
        <div className="py-12 flex justify-center">
          <LoadingSpinner size="lg" message="Loading templates..." />
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="text-center py-12">
            <FiSlash className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">Error loading templates</h3>
            <p className="mt-1 text-sm text-gray-500">An error occurred while loading your templates.</p>
            <div className="mt-6">
              <Button onClick={() => refetch()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : data?.templates?.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FiCopy className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">No templates found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter.search || filter.contentType
                ? "No templates match your filters. Try adjusting your search criteria."
                : "You haven't created any templates yet. Get started by creating your first template."}
            </p>
            <div className="mt-6">
              <Link to="/templates/new">
                <Button icon={<FiPlus />}>
                  Create New Template
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.templates.map((template) => (
              <div key={template.id} className="relative">
                {template.isSystem && (
                  <div className="absolute top-0 right-0 mt-2 mr-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <FiStar className="mr-1" /> System
                    </span>
                  </div>
                )}
                {template.isArchived && (
                  <div className="absolute top-0 right-0 mt-2 mr-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      <FiArchive className="mr-1" /> Archived
                    </span>
                  </div>
                )}
                <Card className={template.isArchived ? 'opacity-70' : ''}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          <Link to={`/templates/${template.id}`} className="hover:text-blue-600">
                            {template.name}
                          </Link>
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Created: {formatDate(template.createdAt)}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getContentTypeBadge(template.contentType)}`}>
                        {template.contentType.charAt(0).toUpperCase() + template.contentType.slice(1)}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500 h-12 overflow-hidden">
                      {template.description || 'No description provided.'}
                    </p>
                    <div className="mt-4 flex justify-between">
                      <Link to={`/templates/${template.id}`}>
                        <Button variant="outline" size="sm" icon={<FiEdit2 />}>
                          Edit
                        </Button>
                      </Link>
                      <div className="space-x-2">
                        {!template.isSystem && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              icon={template.isArchived ? <FiStar /> : <FiArchive />}
                              onClick={() => handleArchiveTemplate(template.id, template.isArchived)}
                            >
                              {template.isArchived ? 'Unarchive' : 'Archive'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              icon={<FiTrash2 />}
                              onClick={() => handleDeleteTemplate(template.id)}
                            >
                              Delete
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
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

export default TemplateList;
