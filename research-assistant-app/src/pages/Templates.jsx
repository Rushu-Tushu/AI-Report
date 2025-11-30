import { useState, useEffect } from 'react';
import { templatesApi } from '../services/api';
import { formatDate, formatFileSize, cn } from '../utils/helpers';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import FileUpload from '../components/common/FileUpload';
import Modal from '../components/common/Modal';

export default function Templates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStructureModal, setShowStructureModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Load templates on mount
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await templatesApi.list();
      setTemplates(response.templates || []);
    } catch (err) {
      console.error('Failed to load templates:', err);
      setError('Failed to load templates. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (file) => {
    try {
      setUploading(true);
      setUploadProgress(0);
      setError(null);

      await templatesApi.upload(file, (progress) => {
        setUploadProgress(progress);
      });

      // Reload templates after upload
      await loadTemplates();
    } catch (err) {
      console.error('Upload failed:', err);
      setError(err.response?.data?.message || 'Failed to upload template. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async () => {
    if (!selectedTemplate) return;

    try {
      setDeleting(true);
      await templatesApi.delete(selectedTemplate.id);
      setShowDeleteModal(false);
      setSelectedTemplate(null);
      await loadTemplates();
    } catch (err) {
      console.error('Delete failed:', err);
      setError(err.response?.data?.message || 'Failed to delete template. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const openDeleteModal = (template) => {
    setSelectedTemplate(template);
    setShowDeleteModal(true);
  };

  const openStructureModal = (template) => {
    setSelectedTemplate(template);
    setShowStructureModal(true);
  };

  if (loading) {
    return <LoadingSpinner centered text="Loading templates..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Templates</h1>
        <p className="text-gray-600 mt-1">Upload and manage your DOCX templates</p>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-800 hover:text-red-900"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Upload Section */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Template</h2>
        
        {uploading ? (
          <div className="text-center py-8">
            <LoadingSpinner size="md" />
            <p className="mt-4 text-gray-600">Uploading... {uploadProgress}%</p>
            <div className="mt-2 w-full max-w-xs mx-auto bg-gray-200 rounded-full h-2">
              <div
                className="bg-sky-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        ) : (
          <>
            <FileUpload
              onFileSelect={handleFileSelect}
              acceptedTypes={['.docx']}
              acceptedTypesLabel="DOCX files"
              maxSize={20 * 1024 * 1024}
            />
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Template Tips:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Use heading styles (Heading 1, Heading 2, etc.) for sections</li>
                <li>• Add placeholders like <code className="bg-gray-200 px-1 rounded">{'{{INTRODUCTION}}'}</code> where content should go</li>
                <li>• Your formatting and styles will be preserved in the output</li>
              </ul>
            </div>
          </>
        )}
      </div>

      {/* Templates List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Your Templates</h2>
        </div>

        {templates.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No templates yet</h3>
            <p className="text-gray-500">
              Upload your first DOCX template to get started.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {templates.map((template) => (
              <div
                key={template.id}
                className="px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      {/* DOCX Icon */}
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {template.filename}
                        </h3>
                        <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                          <span>{formatFileSize(template.file_size || 0)}</span>
                          <span>•</span>
                          <span>{formatDate(template.created_at)}</span>
                          <span>•</span>
                          <span>{template.structure?.length || 0} sections detected</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    {/* View Structure button */}
                    <button
                      onClick={() => openStructureModal(template)}
                      className="p-2 text-gray-400 hover:text-sky-600 rounded-lg hover:bg-gray-100 transition-colors"
                      title="View structure"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => openDeleteModal(template)}
                      className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100 transition-colors"
                      title="Delete template"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Placeholders */}
                {template.placeholders && template.placeholders.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {template.placeholders.map((placeholder, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700"
                      >
                        {placeholder}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Template"
        size="sm"
      >
        <p className="text-gray-600">
          Are you sure you want to delete <strong>{selectedTemplate?.filename}</strong>? 
          This action cannot be undone.
        </p>
        <p className="mt-2 text-sm text-amber-600">
          Note: You cannot delete a template that is being used by a project.
        </p>
        <div className="mt-6 flex justify-end space-x-3">
          <Button
            variant="secondary"
            onClick={() => setShowDeleteModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            loading={deleting}
          >
            Delete
          </Button>
        </div>
      </Modal>

      {/* Structure Modal */}
      <Modal
        isOpen={showStructureModal}
        onClose={() => setShowStructureModal(false)}
        title="Template Structure"
        size="md"
      >
        {selectedTemplate && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Detected sections and headings in <strong>{selectedTemplate.filename}</strong>:
            </p>
            
            {selectedTemplate.structure && selectedTemplate.structure.length > 0 ? (
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {selectedTemplate.structure.map((section, index) => (
                  <div
                    key={index}
                    className="px-4 py-3 flex items-center justify-between"
                    style={{ paddingLeft: `${(section.level || 1) * 16}px` }}
                  >
                    <div className="flex items-center space-x-2">
                      <span className={cn(
                        'text-xs font-medium px-1.5 py-0.5 rounded',
                        section.level === 1 ? 'bg-sky-100 text-sky-700' :
                        section.level === 2 ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      )}>
                        H{section.level || 1}
                      </span>
                      <span className="text-sm text-gray-900">{section.title}</span>
                    </div>
                    {section.placeholder && (
                      <span className="text-xs font-mono bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                        {section.placeholder}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No sections detected in this template.
              </div>
            )}

            <div className="flex justify-end">
              <Button
                variant="secondary"
                onClick={() => setShowStructureModal(false)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}