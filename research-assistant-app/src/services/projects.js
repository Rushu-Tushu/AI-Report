// ============================================================================
// Projects API Service
// ============================================================================
// File: src/services/projects.js
//
// Handles all project-related API calls and Supabase operations.
// ============================================================================

import { supabase } from '../lib/supabase';

// ============================================================================
// Project CRUD Operations
// ============================================================================

/**
 * Fetch all projects for the current user
 * @param {object} options - Query options
 * @returns {Promise<{projects, count, error}>}
 */
export async function getProjects({
  status,
  search,
  orderBy = 'updated_at',
  ascending = false,
  limit = 20,
  offset = 0,
} = {}) {
  let query = supabase
    .from('projects')
    .select(`
      *,
      template:templates(id, name),
      documents:project_documents(
        document:source_documents(id, original_filename, status)
      )
    `, { count: 'exact' });

  if (status) {
    query = query.eq('status', status);
  }

  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  query = query
    .order(orderBy, { ascending })
    .range(offset, offset + limit - 1);

  const { data, count, error } = await query;

  // Transform the nested data structure
  const projects = (data || []).map(project => ({
    ...project,
    template: project.template,
    documents: project.documents?.map(d => d.document) || [],
  }));

  return { projects, count: count || 0, error };
}

/**
 * Fetch a single project with all related data
 * @param {string} id 
 * @returns {Promise<{project, error}>}
 */
export async function getProject(id) {
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      template:templates(*),
      documents:project_documents(
        order_index,
        role,
        document:source_documents(*)
      ),
      drafts(
        id,
        version,
        is_current,
        created_at,
        updated_at
      ),
      exports(
        id,
        format,
        filename,
        created_at
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    return { project: null, error };
  }

  // Transform data
  const project = {
    ...data,
    documents: data.documents
      ?.sort((a, b) => a.order_index - b.order_index)
      .map(d => ({
        ...d.document,
        role: d.role,
        order_index: d.order_index,
      })) || [],
    currentDraft: data.drafts?.find(d => d.is_current) || null,
    drafts: data.drafts || [],
    exports: data.exports || [],
  };

  return { project, error: null };
}

/**
 * Create a new project
 * @param {object} projectData 
 * @returns {Promise<{project, error}>}
 */
export async function createProject(projectData) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { project: null, error: new Error('Not authenticated') };
  }

  const {
    name,
    description,
    mode = 'single',
    purpose = 'full_report',
    templateId,
    documentIds = [],
    globalInstructions,
  } = projectData;

  // Start a transaction-like operation
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      name,
      description,
      mode,
      purpose,
      template_id: templateId,
      global_instructions: globalInstructions,
      status: 'draft',
    })
    .select()
    .single();

  if (projectError) {
    return { project: null, error: projectError };
  }

  // Add documents to project
  if (documentIds.length > 0) {
    const projectDocuments = documentIds.map((docId, index) => ({
      project_id: project.id,
      document_id: docId,
      order_index: index,
      role: 'source',
    }));

    const { error: docsError } = await supabase
      .from('project_documents')
      .insert(projectDocuments);

    if (docsError) {
      // Cleanup: delete the project
      await supabase.from('projects').delete().eq('id', project.id);
      return { project: null, error: docsError };
    }
  }

  return { project, error: null };
}

/**
 * Update a project
 * @param {string} id 
 * @param {object} updates 
 * @returns {Promise<{project, error}>}
 */
export async function updateProject(id, updates) {
  const allowedFields = [
    'name',
    'description',
    'mode',
    'purpose',
    'template_id',
    'section_mapping',
    'global_instructions',
    'status',
    'status_message',
    'generation_progress',
  ];

  const sanitizedUpdates = {};
  for (const key of allowedFields) {
    if (updates[key] !== undefined) {
      sanitizedUpdates[key] = updates[key];
    }
  }

  const { data, error } = await supabase
    .from('projects')
    .update(sanitizedUpdates)
    .eq('id', id)
    .select()
    .single();

  return { project: data, error };
}

/**
 * Delete a project (cascades to documents, drafts, exports)
 * @param {string} id 
 * @returns {Promise<{success, error}>}
 */
export async function deleteProject(id) {
  // Get project exports to delete from storage
  const { data: exports } = await supabase
    .from('exports')
    .select('storage_path')
    .eq('project_id', id);

  // Delete export files from storage
  if (exports && exports.length > 0) {
    const paths = exports.map(e => e.storage_path);
    await supabase.storage.from('exports').remove(paths);
  }

  // Delete project (cascades to related tables)
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);

  return { success: !error, error };
}

// ============================================================================
// Project Documents
// ============================================================================

/**
 * Add a document to a project
 * @param {string} projectId 
 * @param {string} documentId 
 * @param {string} role 
 * @returns {Promise<{success, error}>}
 */
export async function addDocumentToProject(projectId, documentId, role = 'source') {
  // Get current max order index
  const { data: existing } = await supabase
    .from('project_documents')
    .select('order_index')
    .eq('project_id', projectId)
    .order('order_index', { ascending: false })
    .limit(1);

  const orderIndex = existing?.[0]?.order_index + 1 || 0;

  const { error } = await supabase
    .from('project_documents')
    .insert({
      project_id: projectId,
      document_id: documentId,
      order_index: orderIndex,
      role,
    });

  return { success: !error, error };
}

/**
 * Remove a document from a project
 * @param {string} projectId 
 * @param {string} documentId 
 * @returns {Promise<{success, error}>}
 */
export async function removeDocumentFromProject(projectId, documentId) {
  const { error } = await supabase
    .from('project_documents')
    .delete()
    .eq('project_id', projectId)
    .eq('document_id', documentId);

  return { success: !error, error };
}

/**
 * Reorder documents in a project
 * @param {string} projectId 
 * @param {string[]} documentIds - Array of document IDs in new order
 * @returns {Promise<{success, error}>}
 */
export async function reorderProjectDocuments(projectId, documentIds) {
  const updates = documentIds.map((docId, index) => ({
    project_id: projectId,
    document_id: docId,
    order_index: index,
  }));

  // Delete existing and re-insert with new order
  const { error: deleteError } = await supabase
    .from('project_documents')
    .delete()
    .eq('project_id', projectId);

  if (deleteError) {
    return { success: false, error: deleteError };
  }

  const { error: insertError } = await supabase
    .from('project_documents')
    .insert(updates);

  return { success: !insertError, error: insertError };
}

// ============================================================================
// Section Mapping
// ============================================================================

/**
 * Get section mapping for a project
 * @param {string} projectId 
 * @returns {Promise<{mapping, error}>}
 */
export async function getSectionMapping(projectId) {
  const { data, error } = await supabase
    .from('projects')
    .select('section_mapping')
    .eq('id', projectId)
    .single();

  return { mapping: data?.section_mapping || [], error };
}

/**
 * Update section mapping for a project
 * @param {string} projectId 
 * @param {array} mapping 
 * @returns {Promise<{success, error}>}
 */
export async function updateSectionMapping(projectId, mapping) {
  const { error } = await supabase
    .from('projects')
    .update({ 
      section_mapping: mapping,
      status: 'configured',
    })
    .eq('id', projectId);

  return { success: !error, error };
}

// ============================================================================
// AI Generation
// ============================================================================

/**
 * Start AI generation for a project
 * @param {string} projectId 
 * @returns {Promise<{success, error}>}
 */
export async function startGeneration(projectId) {
  // Update project status
  const { error: statusError } = await supabase
    .from('projects')
    .update({ 
      status: 'generating',
      generation_progress: 0,
      status_message: 'Starting generation...',
    })
    .eq('id', projectId);

  if (statusError) {
    return { success: false, error: statusError };
  }

  // Call backend API to start generation
  try {
    const session = await supabase.auth.getSession();
    const response = await fetch(`/api/projects/${projectId}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.data.session?.access_token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Generation failed');
    }

    return { success: true, error: null };
  } catch (err) {
    // Revert status on failure
    await supabase
      .from('projects')
      .update({ status: 'configured', status_message: err.message })
      .eq('id', projectId);

    return { success: false, error: err };
  }
}

/**
 * Subscribe to project generation progress
 * @param {string} projectId 
 * @param {function} callback 
 * @returns {function} Unsubscribe function
 */
export function subscribeToProgress(projectId, callback) {
  const channel = supabase
    .channel(`project-progress:${projectId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'projects',
        filter: `id=eq.${projectId}`,
      },
      (payload) => {
        callback({
          status: payload.new.status,
          progress: payload.new.generation_progress,
          message: payload.new.status_message,
        });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ============================================================================
// Dashboard Stats
// ============================================================================

/**
 * Get user's project statistics
 * @returns {Promise<{stats, error}>}
 */
export async function getProjectStats() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { stats: null, error: new Error('Not authenticated') };
  }

  // Get counts by status
  const { data: projects, error } = await supabase
    .from('projects')
    .select('status')
    .eq('user_id', user.id);

  if (error) {
    return { stats: null, error };
  }

  const stats = {
    total: projects.length,
    draft: projects.filter(p => p.status === 'draft').length,
    inProgress: projects.filter(p => ['configured', 'generating', 'generated', 'editing'].includes(p.status)).length,
    completed: projects.filter(p => p.status === 'completed').length,
    error: projects.filter(p => p.status === 'error').length,
  };

  return { stats, error: null };
}

export default {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  addDocumentToProject,
  removeDocumentFromProject,
  reorderProjectDocuments,
  getSectionMapping,
  updateSectionMapping,
  startGeneration,
  subscribeToProgress,
  getProjectStats,
};