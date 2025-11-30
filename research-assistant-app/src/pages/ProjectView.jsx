import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { projectsApi, exportsApi } from '../services/api';
import { formatDate, formatRelativeTime, getStatusColor, getPurposeDisplay, getModeDisplay, cn } from '../utils/helpers';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Modal from '../components/common/Modal';

export default function ProjectView() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Project data
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Generation state
  const [generating, setGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(null);
  const [generationError, setGenerationError] = useState(null);
  
  // Export state
  const [exporting, setExporting] = useState(false);
  
  // Delete state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Load project on mount
  useEffect(() => {
    loadProject();
  }, [id]);

  // Subscribe to generation progress when generating
  useEffect(() => {
    if (!generating || !project) return;

    const unsubscribe = projectsApi.subscribeToGeneration(id, {
      onProgress: (data) => {
        setGenerationProgress(data);
      },
      onSectionComplete: (data) => {
        setGenerationProgress((prev) => ({
          ...prev,
          completedSections: [...(prev?.completedSections || []), data.section],
        }));
      },
      onError: (data) => {
        setGenerationError(data.message || 'An error occurred during generation');
      },
      onComplete: (data) => {
        setGenerating(false);
        setGenerationProgress(null);
        // Reload project to get updated status
        loadProject();
      },
      onConnectionError: () => {
        setGenerationError('Connection lost. Please refresh the page.');
      },
    });

    return () => {
      unsubscribe();
    };
  }, [generating, project, id]);

  const loadProject = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await projectsApi.get(id, true); // true = include relations
      setProject(response.project);
      
      // Check if project is currently generating
      if (response.project.status === 'generating') {
        setGenerating(true);
      }
    } catch (err) {
      console.error('Failed to load project:', err);
      setError('Failed to load project. It may not exist or you may not have access.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartGeneration = async () => {
    try {
      setGenerating(true);
      setGenerationError(null);
      setGenerationProgress({ status: 'starting', message: 'Starting generation...' });
      
      await projectsApi.generate(id);
    } catch (err) {
      console.error('Failed to start generation:', err);
      setGenerating(false);
      setGenerationError(err.response?.data?.message || 'Failed to start generation');
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const response = await exportsApi.create(project.id, {
        includeReferences: true,
      });
      
      // Open download URL in new tab
      if (response.export?.downloadUrl) {
        window.open(response.export.downloadUrl, '_blank');
      }
    } catch (err) {
      console.error('Export failed:', err);
      setError('Failed to export document. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await projectsApi.delete(id);
      navigate('/dashboard');
    } catch (err) {
      console.error('Delete failed:', err);
      setError('Failed to delete project. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner centered text="Loading project..." />;
  }

  if (error && !project) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Project Not Found</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <span className={cn(
              'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
              getStatusColor(project.status)
            )}>
              {project.status}
            </span>
          </div>
          <p className="text-gray-600 mt-1">
            Created {formatRelativeTime(project.created_at)}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {project.status === 'ready' && (
            <>
              <Link to={`/projects/${id}/edit`}>
                <Button variant="secondary">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Draft
                </Button>
              </Link>
              <Button onClick={handleExport} loading={exporting}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export DOCX
              </Button>
            </>
          )}
          <button
            onClick={() => setShowDeleteModal(true)}
            className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100 transition-colors"
            title="Delete project"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Generation Progress */}
      {generating && (
        <div className="bg-sky-50 border border-sky-200 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <LoadingSpinner size="sm" />
            <h2 className="text-lg font-semibold text-sky-900">Generating Report...</h2>
          </div>
          
          {generationProgress && (
            <div className="space-y-3">
              <p className="text-sky-700">{generationProgress.message || 'Processing...'}</p>
              
              {generationProgress.totalSections && (
                <div>
                  <div className="flex justify-between text-sm text-sky-700 mb-1">
                    <span>Progress</span>
                    <span>
                      {generationProgress.completedSections?.length || 0} / {generationProgress.totalSections} sections
                    </span>
                  </div>
                  <div className="w-full bg-sky-200 rounded-full h-2">
                    <div
                      className="bg-sky-600 h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${((generationProgress.completedSections?.length || 0) / generationProgress.totalSections) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}
              
              {generationProgress.completedSections?.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-sky-800 mb-2">Completed Sections:</p>
                  <div className="flex flex-wrap gap-2">
                    {generationProgress.completedSections.map((section, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded text-xs bg-sky-100 text-sky-700"
                      >
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {section}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {generationError && (
            <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded-lg text-red-700 text-sm">
              {generationError}
            </div>
          )}
        </div>
      )}

      {/* Project Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Info Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Details</h2>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm text-gray-500">Mode</dt>
                <dd className="text-sm font-medium text-gray-900 mt-1">{getModeDisplay(project.mode)}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Purpose</dt>
                <dd className="text-sm font-medium text-gray-900 mt-1">{getPurposeDisplay(project.purpose)}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Created</dt>
                <dd className="text-sm font-medium text-gray-900 mt-1">{formatDate(project.created_at)}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Last Updated</dt>
                <dd className="text-sm font-medium text-gray-900 mt-1">{formatRelativeTime(project.updated_at)}</dd>
              </div>
            </dl>
          </div>

          {/* Source Documents */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Source Documents</h2>
            {project.documents && project.documents.length > 0 ? (
              <div className="space-y-3">
                {project.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{doc.filename}</p>
                      {doc.metadata?.title && (
                        <p className="text-xs text-gray-500 truncate">{doc.metadata.title}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No documents attached</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Template Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Template</h2>
            {project.template ? (
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{project.template.filename}</p>
                  <p className="text-xs text-gray-500">{project.template.structure?.length || 0} sections</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No template selected</p>
            )}
          </div>

          {/* Actions Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
            <div className="space-y-3">
              {project.status === 'draft' && (
                <Button
                  className="w-full"
                  onClick={handleStartGeneration}
                  disabled={generating}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Start Generation
                </Button>
              )}
              
              {project.status === 'ready' && (
                <>
                  <Link to={`/projects/${id}/edit`} className="block">
                    <Button variant="secondary" className="w-full">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit in Editor
                    </Button>
                  </Link>
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={handleExport}
                    loading={exporting}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export as DOCX
                  </Button>
                </>
              )}
              
              {project.status === 'error' && (
                <Button
                  className="w-full"
                  onClick={handleStartGeneration}
                  disabled={generating}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Retry Generation
                </Button>
              )}
            </div>
          </div>

          {/* Section Mapping Preview */}
          {project.section_mapping && project.section_mapping.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Sections</h2>
              <div className="space-y-2">
                {project.section_mapping.map((mapping, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                  >
                    <span className="text-sm text-gray-700">{mapping.templateSection}</span>
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded',
                      project.status === 'ready' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    )}>
                      {project.status === 'ready' ? 'Done' : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Project"
        size="sm"
      >
        <p className="text-gray-600">
          Are you sure you want to delete <strong>{project?.name}</strong>? 
          This will also delete the draft and any exports. This action cannot be undone.
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