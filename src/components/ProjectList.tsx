import React from 'react';
import { Archive, Building2, Calendar, FileEdit, Settings, Trash2, MoveVertical, ChevronDown, ChevronUp, Mail, Phone, MapPin, RefreshCw, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Project } from '../types/greenhouse';
import { ShareProjectModal } from './ShareProjectModal';

interface ProjectListProps {
  onEdit: (projectId: string) => void;
  onConfigure: (projectId: string) => void;
  searchQuery: string;
}

const STATUSES = {
  draft: { label: 'Draft', color: 'bg-gray-100' },
  in_progress: { label: 'In Progress', color: 'bg-blue-50' },
  review: { label: 'Review', color: 'bg-yellow-50' },
  completed: { label: 'Completed', color: 'bg-green-50' }
} as const;

export function ProjectList({ onEdit, onConfigure, searchQuery }: ProjectListProps) {
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [draggingId, setDraggingId] = React.useState<string | null>(null);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [showArchived, setShowArchived] = React.useState(false);
  const [sharingProjectId, setSharingProjectId] = React.useState<string | null>(null);
  const [retryCount, setRetryCount] = React.useState(0);
  const maxRetries = 3;

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('Current user:', user); // Debug current user
      
      if (!user) {
        if (retryCount < maxRetries) {
          // Wait for a short delay before retrying
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
            fetchProjects();
          }, 1000);
          return;
        }
        throw new Error('Authentication failed after retries');
      }

      // First fetch owned projects
      const { data: ownedProjects, error: ownedError } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (ownedError) {
        throw ownedError;
      }

      // Then fetch shared projects
      const { data: sharedProjects, error: sharedError } = await supabase
        .from('project_shares')
        .select(`
          permissions,
          project_id,
          projects (*)
        `)
        .eq('shared_with_id', user.id);

      console.log('Shared projects response:', { data: sharedProjects, error: sharedError }); // Debug response

      if (sharedError) {
        throw sharedError;
      }

      // Process shared projects
      const processedSharedProjects = (sharedProjects || []).map(share => ({
        ...share.projects,
        shared: true,
        permissions: share.permissions
      })).filter(project => project.id); // Filter out any invalid projects

      console.log('Processed shared projects:', processedSharedProjects); // Debug log

      // Combine owned and shared projects
      const allProjects = [
        ...(ownedProjects || []).map(project => ({
          ...project,
          shared: false,
          permissions: 'owner'
        })),
        ...processedSharedProjects
      ];

      console.log('All projects:', allProjects); // Debug log

      setProjects(allProjects);
    } catch (err) {
      console.error('Error fetching projects:', err); // Debug error
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    const setupAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        fetchProjects();
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN') {
          fetchProjects();
        } else if (event === 'SIGNED_OUT') {
          setProjects([]);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    };

    setupAuth();
  }, [retryCount]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    setLoading(true);
    setError(null);

    const { error: selectionsError } = await supabase
      .from('user_selections')
      .delete()
      .eq('project_id', id);

    if (selectionsError) {
      setError('Error deleting project selections: ' + selectionsError.message);
      setLoading(false);
      return;
    }

    const { error: projectError } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (projectError) {
      setError('Error deleting project: ' + projectError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    await fetchProjects();
  };

  const handleShare = (projectId: string) => {
    setSharingProjectId(projectId);
  };

  const handleDragStart = (e: React.DragEvent, projectId: string) => {
    e.dataTransfer.setData('projectId', projectId);
    setDraggingId(projectId);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
  };

  const handleDrop = async (e: React.DragEvent, status: keyof typeof STATUSES) => {
    e.preventDefault();
    const projectId = e.dataTransfer.getData('projectId');
    
    const { error } = await supabase
      .from('projects')
      .update({ status })
      .eq('id', projectId);

    if (error) {
      setError('Error updating project status: ' + error.message);
      return;
    }

    await fetchProjects();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  
  const handleCardClick = (projectId: string, e: React.MouseEvent) => {
    // Prevent expansion when clicking buttons
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    setExpandedId(expandedId === projectId ? null : projectId);
  };

  const handleArchive = async (id: string, currentlyArchived: boolean) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ archived: !currentlyArchived })
        .eq('id', id);

      if (error) throw error;
      await fetchProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const filteredProjects = React.useMemo(() => {
    if (!searchQuery.trim()) return projects;

    const query = searchQuery.toLowerCase().trim();
    return projects.filter(project => 
      project.project_name?.toLowerCase().includes(query) ||
      project.bid_number?.toLowerCase().includes(query) ||
      project.customer_name?.toLowerCase().includes(query)
    );
  }, [projects, searchQuery]);

  const displayedProjects = React.useMemo(() => {
    return filteredProjects.filter(project => project.archived === showArchived);
  }, [filteredProjects, showArchived]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-md">
        {error}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        {showArchived ? (
          <>
            <Archive className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No archived projects</h3>
            <p className="text-gray-500">
              You haven't archived any projects yet.
            </p>
          </>
        ) : (
          <>
            <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-500">
              Create your first greenhouse project to get started.
            </p>
          </>
        )}
      </div>
    );
  }

  const projectsByStatus = displayedProjects.reduce((acc, project) => {
    const status = project.status as keyof typeof STATUSES;
    if (!acc[status]) acc[status] = [];
    acc[status].push(project);
    return acc;
  }, {} as Record<string, Project[]>);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        {projects.some(p => p.shared) && (
          <span className="text-sm text-gray-600 mr-4">
            Including shared projects
          </span>
        )}
        <button
          onClick={() => setShowArchived(!showArchived)}
          className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          {showArchived ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Show Active Projects
            </>
          ) : (
            <>
              <Archive className="h-4 w-4 mr-2" />
              Show Archived Projects
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-full">
        {(Object.keys(STATUSES) as Array<keyof typeof STATUSES>).map((status) => (
            <div
              key={status}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, status)}
              className={`${STATUSES[status].color} rounded-lg p-3 sm:p-4 min-h-[24rem] w-full overflow-hidden`}
            >
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center justify-between">
                {STATUSES[status].label}
                <span className="text-sm text-gray-500">
                  {(projectsByStatus[status] || []).length}
                </span>
              </h3>
              <div className="space-y-4">
                {(projectsByStatus[status] || []).map((project) => (
                  <div
                    key={project.id}
                    draggable
                    onClick={(e) => handleCardClick(project.id, e)}
                    onDragStart={(e) => handleDragStart(e, project.id)}
                    onDragEnd={handleDragEnd}
                    className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-all p-3 sm:p-4 cursor-move w-full ${
                      draggingId === project.id ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-900">
                          {project.project_name}
                          {project.shared && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                              Shared with you
                            </span>
                          )}
                        </h4>
                        {expandedId === project.id ? (
                          <ChevronUp className="h-4 w-4 text-gray-400 mt-1" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-400 mt-1" />
                        )}
                      </div>
                      <MoveVertical className="h-4 w-4 text-gray-400" />
                    </div>
                    
                    {project.customer_name && (
                      <p className="text-sm text-gray-600 flex items-center mb-2">
                        <Building2 className="h-4 w-4 mr-1" />
                        {project.customer_name}
                      </p>
                    )}
                    
                    {project.bid_number && (
                      <p className="text-sm text-gray-600 flex items-center mb-2">
                        <FileEdit className="h-4 w-4 mr-1" />
                        {project.bid_number}
                      </p>
                    )}
                    
                    {expandedId === project.id && (
                      <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                        {project.email && (
                          <p className="text-sm text-gray-600 flex items-start">
                            <Mail className="h-4 w-4 mr-2" />
                            <a 
                              href={`mailto:${project.email}`}
                              className="hover:text-green-600 break-all"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {project.email}
                            </a>
                          </p>
                        )}
                        {project.phone && (
                          <p className="text-sm text-gray-600 flex items-start">
                            <Phone className="h-4 w-4 mr-2" />
                            <a 
                              href={`tel:${project.phone}`}
                              className="hover:text-green-600 break-all"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {project.phone}
                            </a>
                          </p>
                        )}
                        {project.ship_to_address && (
                          <p className="text-sm text-gray-600 flex items-start">
                            <MapPin className="h-4 w-4 mr-2 mt-1 flex-shrink-0" />
                            <a
                              href={`https://www.google.com/maps?q=${encodeURIComponent(project.ship_to_address)}&t=k`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="whitespace-pre-wrap hover:text-green-600 transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {project.ship_to_address}
                            </a>
                          </p>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                      <span className="text-xs text-gray-500 flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(project.created_at).toLocaleDateString()}
                      </span>
                      <div className="flex space-x-1">
                        {!project.shared && (
                          <>
                            <button
                              onClick={() => onEdit(project.id)}
                              className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                              title="Edit Project Details"
                            >
                              <FileEdit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => onConfigure(project.id)}
                              className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                              title="Configure Greenhouse"
                            >
                              <Settings className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleShare(project.id)}
                              className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                              title="Share Project"
                            >
                              <Users className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(project.id)}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                              title={showArchived ? "Delete Permanently" : "Delete Project"}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleArchive(project.id, project.archived)}
                              className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                              title={project.archived ? "Restore Project" : "Archive Project"}
                            >
                              {project.archived ? (
                                <RefreshCw className="h-4 w-4" />
                              ) : (
                                <Archive className="h-4 w-4" />
                              )}
                            </button>
                          </>
                        )}
                        {project.shared && (
                          <span className="text-xs text-gray-500">
                            {project.permissions === 'edit' ? 'Can edit' : 'View only'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
        ))}
      </div>
      
      <ShareProjectModal
        isOpen={sharingProjectId !== null}
        onClose={() => setSharingProjectId(null)}
        projectId={sharingProjectId || ''}
      />
    </div>
  );
}