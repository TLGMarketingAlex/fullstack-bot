// src/components/ContentEditor/PublishingSettings.jsx
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { FiGlobe, FiCalendar, FiCheck, FiAlertCircle, FiInfo } from 'react-icons/fi';
import { useIntegrations } from '../../hooks/useIntegrations';
import { Button } from '../common/Button';
import { LoadingSpinner } from '../common/LoadingSpinner';

export const PublishingSettings = ({ contentItem, onPublish }) => {
  const { integrations, isLoading: isLoadingIntegrations } = useIntegrations();
  const [selectedIntegration, setSelectedIntegration] = useState('');
  const [publishingOptions, setPublishingOptions] = useState({});
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  
  // Set default date/time if content is already scheduled
  useEffect(() => {
    if (contentItem && contentItem.scheduledAt) {
      const scheduledDate = new Date(contentItem.scheduledAt);
      setScheduleDate(scheduledDate.toISOString().split('T')[0]);
      
      const hours = scheduledDate.getHours().toString().padStart(2, '0');
      const minutes = scheduledDate.getMinutes().toString().padStart(2, '0');
      setScheduleTime(`${hours}:${minutes}`);
      
      setIsScheduled(true);
    }
  }, [contentItem]);
  
  // Handle publishing content
  const handlePublish = async () => {
    if (!selectedIntegration) {
      toast.error('Please select an integration to publish to');
      return;
    }
    
    if (contentItem.status === 'published') {
      toast.error('This content has already been published');
      return;
    }
    
    try {
      setIsPublishing(true);
      
      // If scheduled, combine date and time
      let publishData = {
        integrationId: selectedIntegration,
        publishOptions: publishingOptions
      };
      
      if (isScheduled) {
        if (!scheduleDate) {
          toast.error('Please select a date for scheduling');
          setIsPublishing(false);
          return;
        }
        
        // Default time to now if not specified
        const timeToUse = scheduleTime || new Date().toTimeString().slice(0, 5);
        const scheduledDateTime = new Date(`${scheduleDate}T${timeToUse}`);
        
        // Check if date is in the future
        if (scheduledDateTime <= new Date()) {
          toast.error('Scheduled time must be in the future');
          setIsPublishing(false);
          return;
        }
        
        publishData.scheduledAt = scheduledDateTime.toISOString();
      }
      
      // Call appropriate API endpoint based on scheduling
      if (isScheduled) {
        await onPublish('schedule', publishData);
        toast.success('Content scheduled for publishing');
      } else {
        await onPublish('publish', publishData);
        toast.success('Content published successfully');
      }
    } catch (error) {
      console.error('Publish error:', error);
      toast.error(error.message || 'Failed to publish content');
    } finally {
      setIsPublishing(false);
    }
  };
  
  // Get WordPress specific publishing options
  const renderWordPressOptions = () => {
    return (
      <div className="space-y-4 mt-4 pl-4 border-l-2 border-gray-200">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Post Status
          </label>
          <select
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            value={publishingOptions.status || 'draft'}
            onChange={(e) => setPublishingOptions({...publishingOptions, status: e.target.value})}
          >
            <option value="draft">Draft</option>
            <option value="publish">Published</option>
            <option value="pending">Pending Review</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Categories
          </label>
          <select
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            value={publishingOptions.categoryId || ''}
            onChange={(e) => setPublishingOptions({...publishingOptions, categoryId: e.target.value})}
          >
            <option value="">Select Category</option>
            {(integrations.find(i => i.id === selectedIntegration)?.config?.categories || []).map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
        
        <div>
          <div className="flex items-center">
            <input
              id="allow-comments"
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              checked={publishingOptions.allowComments !== false}
              onChange={(e) => setPublishingOptions({...publishingOptions, allowComments: e.target.checked})}
            />
            <label htmlFor="allow-comments" className="ml-2 text-sm text-gray-700">
              Allow Comments
            </label>
          </div>
        </div>
      </div>
    );
  };
  
  // Check if content is ready to publish
  const isContentReady = contentItem && (contentItem.status === 'generated' || contentItem.status === 'draft');
  
  if (!contentItem) {
    return (
      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 flex items-start">
        <FiAlertCircle className="text-yellow-500 h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-yellow-700">
          Please save your content before attempting to publish.
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Content status warning */}
      {!isContentReady && (
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 flex items-start">
          <FiAlertCircle className="text-yellow-500 h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-700">
            <p className="font-medium">Content not ready for publishing</p>
            <p className="mt-1">
              Current status: <span className="font-semibold">{contentItem.status}</span>.
              Content must be in "generated" or "draft" status to publish.
            </p>
          </div>
        </div>
      )}
      
      {/* Already published notification */}
      {contentItem.status === 'published' && (
        <div className="bg-green-50 p-4 rounded-lg border border-green-200 flex items-start">
          <FiCheck className="text-green-500 h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-green-700">
            <p className="font-medium">This content has been published</p>
            {contentItem.publishedAt && (
              <p className="mt-1">
                Published on: {new Date(contentItem.publishedAt).toLocaleString()}
              </p>
            )}
            {contentItem.publishedUrl && (
              <p className="mt-1">
                <a 
                  href={contentItem.publishedUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  View published content
                </a>
              </p>
            )}
          </div>
        </div>
      )}
      
      {/* Scheduled notification */}
      {contentItem.scheduledAt && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 flex items-start">
          <FiCalendar className="text-blue-500 h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-medium">This content is scheduled for publishing</p>
            <p className="mt-1">
              Scheduled for: {new Date(contentItem.scheduledAt).toLocaleString()}
            </p>
          </div>
        </div>
      )}
      
      {/* Main settings form */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-6">Publishing Settings</h2>
        
        {/* Integration selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Integration
          </label>
          {isLoadingIntegrations ? (
            <div className="flex items-center text-gray-500">
              <LoadingSpinner size="sm" />
              <span className="ml-2">Loading integrations...</span>
            </div>
          ) : integrations.length === 0 ? (
            <div className="text-sm text-gray-500">
              No integrations found. Please set up an integration first.
            </div>
          ) : (
            <select
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={selectedIntegration}
              onChange={(e) => setSelectedIntegration(e.target.value)}
              disabled={!isContentReady || isPublishing}
            >
              <option value="">Select an integration</option>
              {integrations.filter(i => i.status === 'active').map(integration => (
                <option key={integration.id} value={integration.id}>
                  {integration.name} ({integration.type})
                </option>
              ))}
            </select>
          )}
        </div>
        
        {/* Integration specific options */}
        {selectedIntegration && (
          <div className="mb-6">
            <h3 className="text-md font-medium mb-2">Publishing Options</h3>
            
            {/* WordPress specific options */}
            {integrations.find(i => i.id === selectedIntegration)?.type === 'wordpress' && (
              renderWordPressOptions()
            )}
            
            {/* Generic options for other integration types */}
            {integrations.find(i => i.id === selectedIntegration)?.type !== 'wordpress' && (
              <div className="text-sm text-gray-500">
                No additional settings available for this integration type.
              </div>
            )}
          </div>
        )}
        
        {/* Scheduling */}
        <div className="mb-6">
          <div className="flex items-center mb-2">
            <input
              id="schedule-publishing"
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              checked={isScheduled}
              onChange={(e) => setIsScheduled(e.target.checked)}
              disabled={!isContentReady || isPublishing}
            />
            <label htmlFor="schedule-publishing" className="ml-2 text-sm font-medium text-gray-700">
              Schedule for later
            </label>
          </div>
          
          {isScheduled && (
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  disabled={!isContentReady || isPublishing}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time
                </label>
                <input
                  type="time"
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  disabled={!isContentReady || isPublishing}
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Submit button */}
        <div className="flex justify-end">
          <Button
            variant="primary"
            icon={isScheduled ? <FiCalendar /> : <FiGlobe />}
            onClick={handlePublish}
            isLoading={isPublishing}
            disabled={!isContentReady || !selectedIntegration || isPublishing}
          >
            {isScheduled ? 'Schedule Publishing' : 'Publish Now'}
          </Button>
        </div>
      </div>
      
      {/* Info box */}
      <div className="bg-blue-50 p-4 rounded-lg flex items-start">
        <FiInfo className="text-blue-500 h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-700">
          <p className="font-medium">Publishing Tips</p>
          <ul className="mt-1 space-y-1 list-disc pl-5">
            <li>You can publish content directly to connected platforms</li>
            <li>Schedule publishing for optimal times to reach your audience</li>
            <li>Published content can still be edited and republished</li>
            <li>Configure integrations in the Integrations section</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PublishingSettings;
