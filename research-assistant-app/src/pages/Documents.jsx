import { useState, useEffect } from 'react';
import { documentsApi } from '../services/api';
import { formatDate, formatFileSize, getStatusColor, cn } from '../utils/helpers';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import FileUpload from '../components/common/FileUpload';
import Modal from '../components/common/Modal';

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Load documents on mount
  useEffect(() => {
    loadDocuments();
  }, []);

  // Poll for processing documents
  useEffect(() => {
    const processingDocs = documents.filter(d => d.status === 'processing');
    
    if (processingDocs.length === 0) return;

    const interval = setInterval(async () => {
      for (const doc of processingDocs) {
        try {
          const response = await documentsApi.getStatus(doc.id);
          if (response.status !== 'processing') {
            // Status changed, reload all documents
            loadDocuments();
            break;
          }
        } catch (err) {
          console.error('Error polling status:', err);
        }
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [documents]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await documentsApi.list();
      setDocuments(response.documents || []);
    } catch (err) {
      console.error('Failed to load documents:', err);
      setError('Failed to load documents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (file) => {
    try {
      setUploading(true);
      setUploadProgress(0);
      setError(null);

      await documentsApi.upload(file, (progress) => {
        setUploadProgress(progress);
      });

      // Reload documents after upload
      await loadDocuments();
    } catch (err) {
      console.error('Upload failed:', err);
      setError(err.response?.data?.message || 'Failed to upload document. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async () => {
    if (!selectedDoc) return;

    try {
      setDeleting(true);
      await documentsApi.delete(selectedDoc.id);
      setShowDeleteModal(false);
      setSelectedDoc(null);
      await loadDocuments();
    } catch (err) {
      console.error('Delete failed:', err);
      setError('Failed to delete document. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const openDeleteModal = (doc) => {
    setSelectedDoc(doc);
    setShowDeleteModal(true);
  };

  if (loading) {
    return <LoadingSpinner centered text="Loading documents..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
        <p className="text-gray-600 mt-1">Upload and manage your research PDFs</p>
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
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Document</h2>
        
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
          <FileUpload
            onFileSelect={handleFileSelect}
            acceptedTypes={['.pdf']}
            acceptedTypesLabel="PDF files"
            maxSize={50 * 1024 * 1024}
          />
        )}
      </div>

      {/* Documents List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Your Documents</h2>
        </div>

        {documents.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
            <p className="text-gray-500">
              Upload your first PDF to get started.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      {/* PDF Icon */}
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {doc.filename}
                        </h3>
                        <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                          <span>{formatFileSize(doc.file_size || 0)}</span>
                          <span>•</span>
                          <span>{formatDate(doc.created_at)}</span>
                          {doc.metadata?.title && (
                            <>
                              <span>•</span>
                              <span className="truncate max-w-xs">{doc.metadata.title}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 ml-4">
                    {/* Status badge */}
                    <span className={cn(
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      getStatusColor(doc.status)
                    )}>
                      {doc.status === 'processing' && (
                        <svg className="animate-spin -ml-0.5 mr-1.5 h-3 w-3" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      )}
                      {doc.status}
                    </span>

                    {/* Extracted content info */}
                    {doc.status === 'ready' && doc.extracted_content && (
                      <div className="hidden sm:flex items-center space-x-3 text-xs text-gray-500">
                        {doc.extracted_content.sections?.length > 0 && (
                          <span>{doc.extracted_content.sections.length} sections</span>
                        )}
                        {doc.extracted_content.tables?.length > 0 && (
                          <span>{doc.extracted_content.tables.length} tables</span>
                        )}
                        {doc.extracted_content.figures?.length > 0 && (
                          <span>{doc.extracted_content.figures.length} figures</span>
                        )}
                      </div>
                    )}

                    {/* Delete button */}
                    <button
                      onClick={() => openDeleteModal(doc)}
                      className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100 transition-colors"
                      title="Delete document"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Warnings */}
                {doc.parsing_warnings && doc.parsing_warnings.length > 0 && (
                  <div className="mt-2 text-xs text-amber-600 bg-amber-50 rounded px-2 py-1">
                    ⚠️ {doc.parsing_warnings.length} warning(s) during extraction
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
        title="Delete Document"
        size="sm"
      >
        <p className="text-gray-600">
          Are you sure you want to delete <strong>{selectedDoc?.filename}</strong>? 
          This action cannot be undone.
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
    </div>
  );
}