import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentsApi, templatesApi, projectsApi } from '../services/api';
import { cn } from '../utils/helpers';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import LoadingSpinner from '../components/common/LoadingSpinner';

const STEPS = [
  { id: 1, name: 'Mode' },
  { id: 2, name: 'Purpose' },
  { id: 3, name: 'Documents' },
  { id: 4, name: 'Template' },
  { id: 5, name: 'Configure' },
];

const PROJECT_MODES = [
  {
    id: 'single',
    title: 'Single Document',
    description: 'Generate a report from one research paper',
    icon: '📄',
  },
  {
    id: 'multi',
    title: 'Multiple Documents',
    description: 'Combine multiple papers into one report (literature review, comparative study)',
    icon: '📚',
  },
];

const PROJECT_PURPOSES = [
  {
    id: 'full_report',
    title: 'Full Report',
    description: 'Complete structured report following your template',
    icon: '📋',
  },
  {
    id: 'summary',
    title: 'Summary',
    description: 'Concise summary of key findings and conclusions',
    icon: '📝',
  },
  {
    id: 'literature_review',
    title: 'Literature Review',
    description: 'Synthesize findings across multiple papers',
    icon: '🔍',
    multiOnly: true,
  },
  {
    id: 'comparative',
    title: 'Comparative Study',
    description: 'Compare and contrast findings from multiple papers',
    icon: '⚖️',
    multiOnly: true,
  },
];

export default function ProjectNew() {
  const navigate = useNavigate();
  
  // Step state
  const [currentStep, setCurrentStep] = useState(1);
  
  // Form data
  const [mode, setMode] = useState('');
  const [purpose, setPurpose] = useState('');
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [projectName, setProjectName] = useState('');
  const [sectionMapping, setSectionMapping] = useState([]);
  
  // Data from API
  const [documents, setDocuments] = useState([]);
  const [templates, setTemplates] = useState([]);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  // Load documents and templates on mount
  useEffect(() => {
    loadData();
  }, []);

  // Update section mapping when template changes
  useEffect(() => {
    if (selectedTemplate?.structure) {
      const initialMapping = selectedTemplate.structure.map((section) => ({
        templateSection: section.title,
        sourceSections: [],
        instructions: '',
      }));
      setSectionMapping(initialMapping);
    }
  }, [selectedTemplate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [docsRes, templatesRes] = await Promise.all([
        documentsApi.list({ status: 'ready' }),
        templatesApi.list(),
      ]);
      setDocuments(docsRes.documents || []);
      setTemplates(templatesRes.templates || []);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load documents and templates.');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    setError(null);
    
    // Validation for each step
    if (currentStep === 1 && !mode) {
      setError('Please select a project mode');
      return;
    }
    if (currentStep === 2 && !purpose) {
      setError('Please select a project purpose');
      return;
    }
    if (currentStep === 3 && selectedDocuments.length === 0) {
      setError('Please select at least one document');
      return;
    }
    if (currentStep === 3 && mode === 'single' && selectedDocuments.length > 1) {
      setError('Single document mode allows only one document');
      return;
    }
    if (currentStep === 4 && !selectedTemplate) {
      setError('Please select a template');
      return;
    }
    
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
  };

  const handleBack = () => {
    setError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleDocumentToggle = (docId) => {
    setSelectedDocuments((prev) => {
      if (prev.includes(docId)) {
        return prev.filter((id) => id !== docId);
      }
      // For single mode, only allow one document
      if (mode === 'single') {
        return [docId];
      }
      return [...prev, docId];
    });
  };

  const handleCreate = async () => {
    if (!projectName.trim()) {
      setError('Please enter a project name');
      return;
    }

    try {
      setCreating(true);
      setError(null);

      const projectData = {
        name: projectName.trim(),
        mode,
        purpose,
        templateId: selectedTemplate.id,
        sourceDocumentIds: selectedDocuments,
        sectionMapping,
      };

      const response = await projectsApi.create(projectData);
      
      // Navigate to the new project
      navigate(`/projects/${response.project.id}`);
    } catch (err) {
      console.error('Failed to create project:', err);
      setError(err.response?.data?.message || 'Failed to create project. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <LoadingSpinner centered text="Loading..." />;
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Create New Project</h1>
        <p className="text-gray-600 mt-1">Set up your research report generation project</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                  currentStep > step.id
                    ? 'bg-sky-600 text-white'
                    : currentStep === step.id
                    ? 'bg-sky-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                )}
              >
                {currentStep > step.id ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  step.id
                )}
              </div>
              <span
                className={cn(
                  'ml-2 text-sm font-medium hidden sm:block',
                  currentStep >= step.id ? 'text-gray-900' : 'text-gray-500'
                )}
              >
                {step.name}
              </span>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    'w-12 sm:w-20 h-0.5 mx-2 sm:mx-4',
                    currentStep > step.id ? 'bg-sky-600' : 'bg-gray-200'
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Step Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {/* Step 1: Mode Selection */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Select Project Mode</h2>
            <p className="text-gray-600">Choose whether to work with one or multiple documents.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              {PROJECT_MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={cn(
                    'p-6 rounded-xl border-2 text-left transition-all',
                    mode === m.id
                      ? 'border-sky-600 bg-sky-50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <div className="text-3xl mb-3">{m.icon}</div>
                  <h3 className="font-semibold text-gray-900">{m.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{m.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Purpose Selection */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Select Purpose</h2>
            <p className="text-gray-600">What type of output do you want to generate?</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              {PROJECT_PURPOSES.filter((p) => !p.multiOnly || mode === 'multi').map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPurpose(p.id)}
                  className={cn(
                    'p-6 rounded-xl border-2 text-left transition-all',
                    purpose === p.id
                      ? 'border-sky-600 bg-sky-50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <div className="text-3xl mb-3">{p.icon}</div>
                  <h3 className="font-semibold text-gray-900">{p.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{p.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Document Selection */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Select Documents</h2>
            <p className="text-gray-600">
              {mode === 'single'
                ? 'Choose the document to generate a report from.'
                : 'Choose the documents to include in your report.'}
            </p>
            
            {documents.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No documents available. Please upload a PDF first.</p>
                <Button variant="secondary" onClick={() => navigate('/documents')}>
                  Go to Documents
                </Button>
              </div>
            ) : (
              <div className="space-y-2 mt-6 max-h-96 overflow-y-auto">
                {documents.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => handleDocumentToggle(doc.id)}
                    className={cn(
                      'w-full p-4 rounded-lg border-2 text-left transition-all flex items-center',
                      selectedDocuments.includes(doc.id)
                        ? 'border-sky-600 bg-sky-50'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <div
                      className={cn(
                        'w-5 h-5 rounded border-2 mr-4 flex items-center justify-center',
                        selectedDocuments.includes(doc.id)
                          ? 'bg-sky-600 border-sky-600'
                          : 'border-gray-300'
                      )}
                    >
                      {selectedDocuments.includes(doc.id) && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{doc.filename}</h3>
                      {doc.metadata?.title && (
                        <p className="text-sm text-gray-500 truncate">{doc.metadata.title}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
            
            {selectedDocuments.length > 0 && (
              <p className="text-sm text-gray-600">
                {selectedDocuments.length} document{selectedDocuments.length > 1 ? 's' : ''} selected
              </p>
            )}
          </div>
        )}

        {/* Step 4: Template Selection */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Select Template</h2>
            <p className="text-gray-600">Choose a template to structure your output.</p>
            
            {templates.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No templates available. Please upload a DOCX template first.</p>
                <Button variant="secondary" onClick={() => navigate('/templates')}>
                  Go to Templates
                </Button>
              </div>
            ) : (
              <div className="space-y-2 mt-6 max-h-96 overflow-y-auto">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template)}
                    className={cn(
                      'w-full p-4 rounded-lg border-2 text-left transition-all',
                      selectedTemplate?.id === template.id
                        ? 'border-sky-600 bg-sky-50'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{template.filename}</h3>
                        <p className="text-sm text-gray-500">
                          {template.structure?.length || 0} sections
                        </p>
                      </div>
                      <div
                        className={cn(
                          'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                          selectedTemplate?.id === template.id
                            ? 'bg-sky-600 border-sky-600'
                            : 'border-gray-300'
                        )}
                      >
                        {selectedTemplate?.id === template.id && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 5: Configure */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Configure Project</h2>
            
            <Input
              label="Project Name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g., Q4 Research Summary"
              required
            />

            {/* Section Mapping Preview */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Section Mapping
              </label>
              <p className="text-sm text-gray-500 mb-4">
                The AI will automatically map source content to these template sections.
              </p>
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-200 max-h-64 overflow-y-auto">
                {selectedTemplate?.structure?.map((section, index) => (
                  <div key={index} className="px-4 py-3 flex items-center justify-between">
                    <span className="text-sm text-gray-900">{section.title}</span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      Auto-mapped
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Project Summary</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Mode:</dt>
                  <dd className="text-gray-900">{mode === 'single' ? 'Single Document' : 'Multiple Documents'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Purpose:</dt>
                  <dd className="text-gray-900">{PROJECT_PURPOSES.find((p) => p.id === purpose)?.title}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Documents:</dt>
                  <dd className="text-gray-900">{selectedDocuments.length} selected</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Template:</dt>
                  <dd className="text-gray-900 truncate max-w-[200px]">{selectedTemplate?.filename}</dd>
                </div>
              </dl>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
          <Button
            variant="secondary"
            onClick={currentStep === 1 ? () => navigate('/dashboard') : handleBack}
          >
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </Button>
          
          {currentStep < STEPS.length ? (
            <Button onClick={handleNext}>
              Next
            </Button>
          ) : (
            <Button onClick={handleCreate} loading={creating}>
              Create Project
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}