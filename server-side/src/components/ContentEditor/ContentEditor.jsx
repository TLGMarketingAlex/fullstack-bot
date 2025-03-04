// frontend/src/components/ContentEditor/ContentEditor.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { FiPlus, FiTrash2, FiEdit, FiMove, FiSave, FiRefreshCw, FiCheck, FiXCircle } from 'react-icons/fi';

import { useContentItem } from '../../hooks/useContentItem';
import { useTemplates } from '../../hooks/useTemplates';
import { useGeneration } from '../../hooks/useGeneration';
import { ContentElementEditor } from './ContentElementEditor';
import { TemplateSelector } from './TemplateSelector';
import { GenerationSettingsPanel } from './GenerationSettingsPanel';
import { PublishingSettings } from './PublishingSettings';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Button } from '../common/Button';
import { TabPanel } from '../common/TabPanel';
import { Modal } from '../common/Modal';

// Validation schema for content item
const ContentItemSchema = Yup.object().shape({
  title: Yup.string().required('Title is required'),
  contentType: Yup.string().required('Content type is required'),
  format: Yup.string().required('Format is required')
});

export const ContentEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('editor');
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [showGenerateConfirmation, setShowGenerateConfirmation] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [elements, setElements] = useState([]);
  const [previewMode, setPreviewMode] = useState(false);
  const [generationSettings, setGenerationSettings] = useState({
    aiProvider: 'openai',
    model: 'gpt-4',
    creativity: 0.7,
    maxLength: 2000,
    seoOptimize: false,
    keywords: [],
    wordCount: 1000
  });

  // Fetch content item data
  const { 
    contentItem, 
    isLoading: isLoadingContent,
    error: contentError,
    updateContentItem,
    saveContentItem
  } = useContentItem(id);

  // Fetch templates
  const { templates, isLoading: isLoadingTemplates } = useTemplates();

  // Generation hook
  const { 
    createGeneration, 
    generationStatus, 
    checkGenerationStatus 
  } = useGeneration();

  // Initialize editor with content from API
  useEffect(() => {
    if (contentItem && contentItem.content) {
      try {
        // If the content is stored as JSON elements
        if (contentItem.metadata && contentItem.metadata.elements) {
          setElements(contentItem.metadata.elements);
        } else {
          // Otherwise, create a single content element
          setElements([{
            id: 'main-content',
            type: 'text',
            content: contentItem.content
          }]);
        }
      } catch (error) {
        console.error('Error parsing content:', error);
        // Fallback to a single content element
        setElements([{
          id: 'main-content',
          type: 'text',
          content: contentItem.content || ''
        }]);
      }
    }
  }, [contentItem]);

  // Check generation status
  useEffect(() => {
    if (generationStatus && generationStatus.status === 'processing') {
      const intervalId = setInterval(() => {
        checkGenerationStatus(generationStatus.id);
      }, 5000);

      return () => clearInterval(intervalId);
    }

    if (generationStatus && generationStatus.status === 'completed') {
      setIsGenerating(false);
      toast.success('Content generation completed!');
      // Reload content item to get generated content
      navigate(0);
    } else if (generationStatus && generationStatus.status === 'failed') {
      setIsGenerating(false);
      toast.error(`Generation failed: ${generationStatus.error || 'Unknown error'}`);
    }
  }, [generationStatus, checkGenerationStatus, navigate]);

  // Loading state
  if (isLoadingContent || isLoadingTemplates) {
    return <LoadingSpinner message="Loading content editor..." />;
  }

  // Error state
  if (contentError) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded">
        <h3 className="font-bold">Error loading content</h3>
        <p>{contentError.message || 'Unknown error'}</p>
        <Button 
          className="mt-2" 
          variant="secondary"
          onClick={() => navigate('/content')}
        >
          Return to Content List
        </Button>
      </div>
    );
  }

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Handle drag and drop of content elements
  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(elements);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setElements(items);
  };

  // Add a new content element
  const handleAddElement = (type = 'text') => {
    const newElement = {
      id: `element-${Date.now()}`,
      type,
      content: ''
    };

    setElements([...elements, newElement]);
  };

  // Remove a content element
  const handleRemoveElement = (index) => {
    const newElements = [...elements];
    newElements.splice(index, 1);
    setElements(newElements);
  };

  // Update a content element
  const handleUpdateElement = (index, content) => {
    const newElements = [...elements];
    newElements[index].content = content;
    setElements(newElements);
  };

  // Get the combined content text
  const getCombinedContent = () => {
    return elements.map(el => el.content).join('\n\n');
  };

  // Handle save content
  const handleSave = async (values) => {
    try {
      const updatedContent = {
        ...values,
        content: getCombinedContent(),
        metadata: {
          ...contentItem.metadata,
          elements,
          lastEdited: new Date().toISOString()
        }
      };

      await saveContentItem(updatedContent);
      toast.success('Content saved successfully!');
      setShowSaveConfirmation(false);
    } catch (error) {
      console.error('Error saving content:', error);
      toast.error('Failed to save content: ' + (error.message || 'Unknown error'));
    }
  };

  // Handle generate content
  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      setShowGenerateConfirmation(false);

      const promptData = {
        ...generationSettings,
        title: contentItem.title,
        contentType: contentItem.contentType,
        templateId: contentItem.templateId
      };

      // If we have existing content and elements, include them
      if (elements.length > 0) {
        promptData.existingContent = getCombinedContent();
      }

      await createGeneration({
        contentItemId: contentItem.id,
        promptData,
        isNewContent: false
      });

      toast.success('Content generation started!');
    } catch (error) {
      console.error('Error generating content:', error);
      setIsGenerating(false);
      toast.error('Failed to start generation: ' + (error.message || 'Unknown error'));
    }
  };

  // Handle template selection
  const handleTemplateSelect = async (templateId) => {
    if (!templateId) return;

    try {
      const selectedTemplate = templates.find(t => t.id === templateId);
      
      if (!selectedTemplate) {
        toast.error('Template not found');
        return;
      }

      // Update content item with template
      await updateContentItem({
        templateId,
        contentType: selectedTemplate.contentType,
        metadata: {
          ...contentItem.metadata,
          templateApplied: new Date().toISOString(),
          templateName: selectedTemplate.name
        }
      });

      // If the template has predefined structure, update elements
      if (selectedTemplate.structure && Array.isArray(selectedTemplate.structure)) {
        setElements(selectedTemplate.structure);
      }

      // If the template has default generation settings, update them
      if (selectedTemplate.defaultParameters) {
        setGenerationSettings({
          ...generationSettings,
          ...selectedTemplate.defaultParameters
        });
      }

      toast.success(`Template "${selectedTemplate.name}" applied successfully!`);
    } catch (error) {
      console.error('Error applying template:', error);
      toast.error('Failed to apply template: ' + (error.message || 'Unknown error'));
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header section */}
        <div className="p-6 bg-gray-50 border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {contentItem?.title || 'New Content Item'}
              </h1>
              <p className="text-gray-500 mt-1">
                {contentItem?.contentType?.charAt(0).toUpperCase() + contentItem?.contentType?.slice(1)} • 
                {contentItem?.wordCount ? ` ${contentItem.wordCount} words • ` : ' '}
                Last edited: {contentItem?.updatedAt ? new Date(contentItem.updatedAt).toLocaleString() : 'Never'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isGenerating ? (
                <Button variant="secondary" disabled>
                  <LoadingSpinner size="sm" /> Generating...
                </Button>
              ) : (
                <Button 
                  variant="primary" 
                  onClick={() => setShowGenerateConfirmation(true)}
                  disabled={contentItem?.status === 'published'}
                >
                  <FiRefreshCw className="mr-2" /> Generate Content
                </Button>
              )}
              <Button 
                variant="secondary" 
                onClick={() => setShowSaveConfirmation(true)}
              >
                <FiSave className="mr-2" /> Save
              </Button>
            </div>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              className={`px-4 py-3 text-sm font-medium ${activeTab === 'editor' 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => handleTabChange('editor')}
            >
              Content Editor
            </button>
            <button
              className={`px-4 py-3 text-sm font-medium ${activeTab === 'settings' 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => handleTabChange('settings')}
            >
              Generation Settings
            </button>
            <button
              className={`px-4 py-3 text-sm font-medium ${activeTab === 'preview' 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => handleTabChange('preview')}
            >
              Preview
            </button>
            <button
              className={`px-4 py-3 text-sm font-medium ${activeTab === 'publish' 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => handleTabChange('publish')}
            >
              Publish
            </button>
          </nav>
        </div>

        {/* Tab content */}
        <div className="p-6">
          <TabPanel active={activeTab === 'editor'}>
            <div className="flex flex-col md:flex-row gap-6">
              {/* Left column - Template Selector */}
              <div className="w-full md:w-1/4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-lg mb-3">Templates</h3>
                  <TemplateSelector 
                    templates={templates}
                    selectedTemplateId={contentItem?.templateId}
                    onSelect={handleTemplateSelect}
                  />
                </div>
              </div>

              {/* Right column - Content Editor */}
              <div className="w-full md:w-3/4">
                <Formik
                  initialValues={{
                    title: contentItem?.title || '',
                    contentType: contentItem?.contentType || 'blog',
                    format: contentItem?.format || 'markdown'
                  }}
                  validationSchema={ContentItemSchema}
                  onSubmit={handleSave}
                  enableReinitialize
                >
                  {({ isSubmitting }) => (
                    <Form>
                      <div className="mb-6">
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                          Title
                        </label>
                        <Field
                          type="text"
                          id="title"
                          name="title"
                          placeholder="Enter content title"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <ErrorMessage name="title" component="div" className="text-red-600 text-sm mt-1" />
                      </div>

                      <div className="mb-6 flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                          <label htmlFor="contentType" className="block text-sm font-medium text-gray-700 mb-1">
                            Content Type
                          </label>
                          <Field
                            as="select"
                            id="contentType"
                            name="contentType"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="blog">Blog Post</option>
                            <option value="product">Product Description</option>
                            <option value="social">Social Media Post</option>
                            <option value="email">Email</option>
                            <option value="custom">Custom</option>
                          </Field>
                          <ErrorMessage name="contentType" component="div" className="text-red-600 text-sm mt-1" />
                        </div>

                        <div className="flex-1">
                          <label htmlFor="format" className="block text-sm font-medium text-gray-700 mb-1">
                            Format
                          </label>
                          <Field
                            as="select"
                            id="format"
                            name="format"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="markdown">Markdown</option>
                            <option value="html">HTML</option>
                            <option value="plain">Plain Text</option>
                          </Field>
                          <ErrorMessage name="format" component="div" className="text-red-600 text-sm mt-1" />
                        </div>
                      </div>

                      <div className="mb-4 flex justify-between items-center">
                        <h3 className="font-medium text-lg">Content Blocks</h3>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddElement('text')}
                          >
                            <FiPlus className="mr-1" /> Add Text Block
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddElement('heading')}
                          >
                            <FiPlus className="mr-1" /> Add Heading
                          </Button>
                        </div>
                      </div>

                      <DragDropContext onDragEnd={handleDragEnd}>
                        <Droppable droppableId="content-elements">
                          {(provided) => (
                            <div
                              {...provided.droppableProps}
                              ref={provided.innerRef}
                              className="space-y-4"
                            >
                              {elements.map((element, index) => (
                                <Draggable key={element.id} draggableId={element.id} index={index}>
                                  {(provided) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      className="border border-gray-200 rounded-md p-4 bg-white"
                                    >
                                      <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center gap-2">
                                          <div {...provided.dragHandleProps} className="cursor-move text-gray-400 hover:text-gray-600">
                                            <FiMove />
                                          </div>
                                          <span className="text-sm font-medium text-gray-700">
                                            {element.type.charAt(0).toUpperCase() + element.type.slice(1)} Block
                                          </span>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveElement(index)}
                                          className="text-red-500 hover:text-red-700"
                                        >
                                          <FiTrash2 />
                                        </button>
                                      </div>
                                      <ContentElementEditor
                                        content={element.content}
                                        type={element.type}
                                        onChange={(content) => handleUpdateElement(index, content)}
                                      />
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </DragDropContext>

                      {elements.length === 0 && (
                        <div className="p-8 text-center border-2 border-dashed border-gray-300 rounded-md">
                          <p className="text-gray-500">No content blocks yet. Add a block or generate content to get started.</p>
                          <div className="mt-4 flex justify-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAddElement('text')}
                            >
                              <FiPlus className="mr-1" /> Add Text Block
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowGenerateConfirmation(true)}
                              disabled={isGenerating}
                            >
                              <FiRefreshCw className="mr-1" /> Generate Content
                            </Button>
                          </div>
                        </div>
                      )}
                    </Form>
                  )}
                </Formik>
              </div>
            </div>
          </TabPanel>

          <TabPanel active={activeTab === 'settings'}>
            <GenerationSettingsPanel
              settings={generationSettings}
              onChange={setGenerationSettings}
              contentType={contentItem?.contentType || 'blog'}
            />
          </TabPanel>

          <TabPanel active={activeTab === 'preview'}>
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">{contentItem?.title}</h2>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewMode(!previewMode)}
                  >
                    {previewMode ? <><FiEdit className="mr-1" /> Show Markdown</> : <><FiCheck className="mr-1" /> Preview</>}
                  </Button>
                </div>
              </div>

              <div className="prose prose-blue max-w-none">
                {previewMode ? (
                  <ReactMarkdown>{getCombinedContent()}</ReactMarkdown>
                ) : (
                  <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm whitespace-pre-wrap">
                    {getCombinedContent()}
                  </pre>
                )}
              </div>
            </div>
          </TabPanel>

          <TabPanel active={activeTab === 'publish'}>
            <PublishingSettings
              contentItem={contentItem}
              onPublish={() => {
                toast.success('Publishing settings saved!');
              }}
            />
          </TabPanel>
        </div>
      </div>

      {/* Save Confirmation Modal */}
      <Modal
        isOpen={showSaveConfirmation}
        onClose={() => setShowSaveConfirmation(false)}
        title="Save Content"
      >
        <div className="mb-4">
          <p>Are you sure you want to save your changes?</p>
        </div>
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => setShowSaveConfirmation(false)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              handleSave({
                title: contentItem?.title,
                contentType: contentItem?.contentType,
                format: contentItem?.format
              });
            }}
          >
            Save Changes
          </Button>
        </div>
      </Modal>

      {/* Generate Confirmation Modal */}
      <Modal
        isOpen={showGenerateConfirmation}
        onClose={() => setShowGenerateConfirmation(false)}
        title="Generate Content"
      >
        <div className="mb-4">
          <p>Generating content will replace any existing content. Are you sure you want to continue?</p>
          <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 rounded">
            <p className="text-sm">
              <strong>Note:</strong> This will use approximately {generationSettings.wordCount} credits from your account.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => setShowGenerateConfirmation(false)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? <LoadingSpinner size="sm" /> : <FiRefreshCw className="mr-1" />}
            Generate Content
          </Button>
        </div>
      </Modal>
    </div>
  );
};

// Smaller child components would be defined in separate files
// These components are referenced above:
// ContentElementEditor
// TemplateSelector
// GenerationSettingsPanel
// PublishingSettings
// Button
// Modal
// TabPanel
// LoadingSpinner
