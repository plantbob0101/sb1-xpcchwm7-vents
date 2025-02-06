import React from 'react';
import { LogOut, Plus, Search, X } from 'lucide-react';
import { supabase } from './lib/supabase';
import { AuthModal } from './components/AuthModal';
import { ProjectList } from './components/ProjectList';
import { ProjectEditor } from './components/ProjectEditor';
import { ProjectBuilder } from './components/ProjectBuilder';
import { GreenhouseLogo } from './components/GreenhouseLogo';
import { NewProjectModal } from './components/NewProjectModal';

function App() {
  const [showAuthModal, setShowAuthModal] = React.useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = React.useState(false);
  const [user, setUser] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [showProjects, setShowProjects] = React.useState(false);
  const [editingProjectId, setEditingProjectId] = React.useState<string | null>(null);
  const [configuringProjectId, setConfiguringProjectId] = React.useState<string | null>(null);
  const [isCreating, setIsCreating] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [projectListKey, setProjectListKey] = React.useState(0);

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleNewProject = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setShowNewProjectModal(true);
  };

  const handleCreateProject = async (projectData: {
    project_name: string;
    bid_number: string;
    customer_name: string;
    ship_to_address: string;
    phone: string;
    email: string;
  }) => {
    setIsCreating(true);
    setError(null);
    
    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        ...projectData,
        status: 'draft'
      })
      .select()
      .single();
      
    if (error) {
      setError('Error creating project: ' + error.message);
      setIsCreating(false);
      return;
    }
    
    setShowNewProjectModal(false);
    setShowProjects(true);
    setProjectListKey(prev => prev + 1); // Force ProjectList to re-fetch
    setIsCreating(false);
  };

  const handleViewProjects = async () => {
    setShowProjects(true);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleHomeClick = () => {
    setShowProjects(false);
    setEditingProjectId(null);
    setConfiguringProjectId(null);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 w-full">
      <header className="bg-white shadow-sm">
        <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-2 sm:py-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3 overflow-hidden flex-shrink min-w-0">
              <button
                onClick={handleHomeClick}
                className="flex items-center space-x-2 sm:space-x-3 group hover:opacity-80 transition-opacity min-w-0 flex-shrink"
              >
                <GreenhouseLogo className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 flex-shrink-0" />
                <h1 className="text-base sm:text-2xl font-semibold text-gray-900 truncate">Greenhouse Builder</h1>
              </button>
            </div>

            <div className="flex items-center space-x-1 sm:space-x-4 ml-1 sm:ml-4 flex-shrink-0">
              {user ? (
                <>
                  <button
                    onClick={handleSignOut}
                    className="p-1 sm:p-2 text-gray-600 hover:text-gray-800"
                    title="Sign Out"
                  >
                    <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-2 sm:px-4 py-1 sm:py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-xs sm:text-base"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
          
          {showProjects && (
            <div className="relative max-w-md mx-auto">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects..."
                className="w-full pl-9 pr-9 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="w-full max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-8">
        {showProjects ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              {editingProjectId ? (
                <ProjectEditor
                  projectId={editingProjectId}
                  onBack={() => setEditingProjectId(null)}
                />
              ) : configuringProjectId ? (
                <ProjectBuilder
                  projectId={configuringProjectId}
                  onBack={() => setConfiguringProjectId(null)}
                />
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-gray-900">My Projects</h2>
                  <button
                    onClick={handleNewProject}
                    disabled={isCreating}
                    className="flex items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm sm:text-base"
                  >
                    {isCreating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent mr-2" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                        New Project
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
            {!editingProjectId && !configuringProjectId && (
              <ProjectList
                key={projectListKey}
                onEdit={setEditingProjectId}
                onConfigure={setConfiguringProjectId}
                searchQuery={searchQuery}
              />
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-center py-12">
              <GreenhouseLogo className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome to Greenhouse Builder</h2>
              <p className="text-lg text-gray-600 mb-8">
                Design your perfect greenhouse with our step-by-step builder.
                Start by creating a new project or continue working on an existing one.
              </p>
              <div className="flex justify-center space-x-4">
                {user ? (
                  <>
                    <button 
                      onClick={handleNewProject}
                      disabled={isCreating}
                      className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                      {isCreating ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2 inline-block" />
                          Creating...
                        </>
                      ) : (
                        'Create New Project'
                      )}
                    </button>
                    <button 
                      onClick={handleViewProjects}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      View Projects
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    Sign In to Get Started
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-md">
            {error}
          </div>
        )}
      </main>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => setShowAuthModal(false)}
      />
      <NewProjectModal
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
        onSubmit={handleCreateProject}
        isLoading={isCreating}
      />
    </div>
  );
}

export default App;